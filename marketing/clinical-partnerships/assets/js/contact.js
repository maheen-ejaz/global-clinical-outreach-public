/* An explicit clipboard action only. The semantic email links work without JS. */
(() => {
  const root = document.querySelector('.gc-clinical-partnerships');
  const button = root?.querySelector('[data-copy-email]');
  const address = root?.querySelector('[data-email-address]');
  const status = root?.querySelector('[data-copy-status]');
  if (!button || !address || !status) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(address.textContent.trim());
      status.textContent = 'Email address copied';
    } catch {
      status.textContent = 'Copy is unavailable. Select the email address above and copy it, or use the email link.';
    }
  });
})();
