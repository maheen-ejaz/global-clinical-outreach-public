import json
import os

import pytest

from pipeline.activity import apply, export


class DB:
    def __init__(self):
        self.calls = []

    def rpc(self, name, values):
        self.calls.append((name, values))
        return {'state': 'scheduled'}

    def select(self, table, params):
        return [{'domain': 'fixture.test', 'draft': {'body': 'Private fixture'}}]


def test_operator_requires_bounded_action_and_saved_version():
    db = DB()
    with pytest.raises(ValueError, match='Unsupported'):
        apply(db, {'domain': 'fixture.test', 'version': 1, 'action': 'send', 'data': {}})
    with pytest.raises(ValueError, match='saved version'):
        apply(db, {'domain': 'fixture.test', 'version': 0, 'action': 'scheduled', 'data': {}})
    assert not db.calls
    apply(db, {'domain': 'fixture.test', 'version': 2, 'action': 'checked', 'data': {'evidence': 'Fixture'}})
    assert db.calls[0][0] == 'outreach_record'
    assert db.calls[0][1]['p_version'] == 2


def test_export_preserves_correspondence_in_private_local_file(tmp_path):
    directory = tmp_path / 'outreach'
    directory.mkdir(mode=0o755)
    assert export(DB(), directory) == 1
    assert os.stat(directory).st_mode & 0o777 == 0o700
    path = directory / 'activity.json'
    assert json.loads(path.read_text())[0]['draft']['body'] == 'Private fixture'
    assert os.stat(path).st_mode & 0o777 == 0o600


def test_input_file_and_existing_directory_are_private_before_import(tmp_path, monkeypatch):
    from types import SimpleNamespace
    from pipeline import activity

    directory = tmp_path / 'outreach'
    directory.mkdir(mode=0o755)
    path = directory / 'action.json'
    path.write_text(json.dumps({'domain': 'fixture.test', 'version': 1, 'action': 'checked', 'data': {'evidence': 'Fixture'}}))
    path.chmod(0o644)
    db = DB()
    monkeypatch.setattr(activity, 'DATA_DIR', tmp_path)
    monkeypatch.setattr(activity, 'load_settings', lambda: SimpleNamespace(supabase_url='https://fixture.test', supabase_service_role_key='fixture'))
    monkeypatch.setattr(activity, 'Supabase', lambda *args: db)
    activity.main()
    assert os.stat(directory).st_mode & 0o777 == 0o700
    assert os.stat(directory / 'last-action.json').st_mode & 0o777 == 0o600
