"""Explicit-session correspondence import/export. Never sends or schedules an email.

Input: data/outreach/action.json {domain,version,action,data}.
Output: data/outreach/activity.json for preparation and Gmail reconciliation.
Use only the bound outreach-activity runner from clean canonical main.
"""
import json
import os

from .config import DATA_DIR, load_settings
from .supa import Supabase

ACTIONS = {'prepare', 'review', 'begin_scheduling', 'scheduled', 'sent', 'cancelled', 'send_failed', 'checked', 'reply'}


def apply(db, document):
    if set(document) != {'domain', 'version', 'action', 'data'}:
        raise ValueError('Expected domain, version, action and data')
    if document['action'] not in ACTIONS:
        raise ValueError('Unsupported activity action')
    if not isinstance(document['version'], int) or document['version'] < 1 or not isinstance(document['data'], dict):
        raise ValueError('A saved version and object data are required')
    return db.rpc('outreach_record', {f'p_{key}': value for key, value in document.items()})


def export(db, directory):
    rows = db.select('outreach_items', {'select': '*', 'order': 'domain'})
    if len(rows) >= 1000:
        raise RuntimeError('Activity export reached the API limit; add pagination before continuing')
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(directory, 0o700)
    path = directory / 'activity.json'
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(rows, stream, indent=2)
    os.chmod(path, 0o600)
    return len(rows)


def main():
    settings = load_settings()
    db = Supabase(settings.supabase_url, settings.supabase_service_role_key)
    directory = DATA_DIR / 'outreach'
    path = directory / 'action.json'
    export(db, directory)  # Reconcile persisted state even if a prior action's response was lost.
    if path.exists():
        os.chmod(path, 0o600)
        apply(db, json.loads(path.read_text()))
        # Preserve evidence locally; never repeat an uncertain Gmail operation.
        path.rename(directory / 'last-action.json')
        print('Recorded verified activity.')
    print(f'Exported {export(db, directory)} activity rows to the private local store.')


if __name__ == '__main__':
    main()
