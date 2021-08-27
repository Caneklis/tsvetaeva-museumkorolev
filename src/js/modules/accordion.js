let accordionContentOpen = 'accordion__content--open';
let accordionControls = document.querySelectorAll('.js-title');

if (accordionControls) {
  for (let i = 0; i < accordionControls.length; i++) {
    accordionControls[i].addEventListener('click', toggleItem, false);
  }
}

function toggleItem(e) {
  let openContent = document.querySelector('.' + accordionContentOpen);
  let sameElem = false;
  if (openContent) {
    closeItem(openContent);
    sameElem = openContent.previousElementSibling === e.target;
  }
  if (!sameElem) {
    let panel = e.target.nextElementSibling;
    openItem(panel);
  }
}
function closeItem(openContent) {
  openContent.classList.remove(accordionContentOpen);
  openContent.style.maxHeight = 0;
  openContent.style.padding = '0';
}
function openItem(panel) {
  panel.classList.add(accordionContentOpen);
  panel.style.maxHeight = panel.scrollHeight + 'px';
  panel.style.padding = '1em 1.5em 2em 1.5em';
}
let defaultPanel = document.querySelector('.accordion__content');
if (defaultPanel) {
  defaultPanel.classList.remove(accordionContentOpen);
  setTimeout(openItem, 1000, defaultPanel);
}
