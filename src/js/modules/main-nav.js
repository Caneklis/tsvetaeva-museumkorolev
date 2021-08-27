(() => {
  const menuButton = document.querySelector('.main-nav__button');
  const menuList = document.querySelector('.main-nav__list');

  menuButton.addEventListener('click', () => {
    let expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', !expanded);
    menuButton.classList.toggle('main-nav__button--open');
    menuList.classList.toggle('main-nav__list--open');
  });
})();
