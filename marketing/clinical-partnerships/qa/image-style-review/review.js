const styles = [{"key":"documentary","title":"Clinical documentary","description":"Experienced faculty, candid teaching and realistic clinical spaces.","alt":"AI-generated editorial photograph of experienced clinicians discussing clinical education in an academic teaching room."},{"key":"architecture","title":"Institutional architecture","description":"Established academic settings, strong architectural composition and fewer people.","alt":"AI-generated architectural photograph of a generic academic medical centre with faculty walking through a teaching wing."},{"key":"portrait","title":"Faculty portrait","description":"An authoritative senior educator, composed as an institutional editorial portrait.","alt":"AI-generated formal editorial portrait of an experienced clinical educator in an academic office."},{"key":"monochrome","title":"Monochrome editorial","description":"Black-and-white documentary imagery with stronger contrast and visual restraint.","alt":"AI-generated black-and-white photograph of senior clinical faculty discussing a case at an academic teaching conference."},{"key":"illustration","title":"Architectural ink illustration","description":"A restrained editorial drawing that communicates an academic setting without stock photography.","alt":"AI-generated ink illustration of experienced faculty in an academic medical teaching space."}];
const buttons = [...document.querySelectorAll('[data-style]')];
const previewStyle = (key, navigate) => {
 const style = styles.find(item => item.key === key);
 if (!style) return;
 buttons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.style === key)));
 document.querySelectorAll('[data-preview-image]').forEach(image => { image.src = 'images/' + style.key + '.webp'; image.alt = style.alt; });
 document.querySelector('[data-context-title]').textContent = 'Direction ' + (styles.indexOf(style) + 1) + ' · ' + style.title;
 document.querySelector('[data-context-status]').textContent = 'Previewing ' + style.title.toLowerCase() + ' in the hero and course card.';
 document.querySelector('#review-direction').value = key;
 if (navigate) {
  const heading = document.querySelector('[data-context-title]');
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  document.querySelector('#context').scrollIntoView({ behavior: 'instant', block: 'start' });
 }
};
buttons.forEach(button => button.addEventListener('click', () => previewStyle(button.dataset.style, true)));
document.querySelector('#review-direction').addEventListener('change', event => previewStyle(event.target.value, false));
document.querySelector('.review-context-tools').hidden = false;
document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
 document.body.dataset.theme = button.dataset.themeChoice;
 document.querySelectorAll('[data-theme-choice]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));

document.querySelectorAll('[data-style], [data-theme-choice]').forEach(button => { button.hidden = false; });
