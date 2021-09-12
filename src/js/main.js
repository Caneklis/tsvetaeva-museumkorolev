import mapboxgl from "mapbox-gl";
import Swiper from "../../node_modules/swiper/swiper-bundle";
// import { doc } from 'prettier';

document.addEventListener("DOMContentLoaded", () => {
  // eslint-disable-next-line no-console
  console.log("DOM полностью загружен и разобран");
  require("./modules/main-nav");

  const searchFormToggle = document.querySelector(".header__search-btn");
  const searcForm = document.querySelector(".header__search");

  searchFormToggle.addEventListener("click", () => {
    let expanded = searchFormToggle.getAttribute("aria-expanded") === "true";
    searchFormToggle.setAttribute("aria-expanded", !expanded);
    searcForm.classList.add("header__search--open");
  });

  document.addEventListener("click", function (e) {
    const target = e.target;
    const itsMenu = target == searcForm || searcForm.contains(target);
    // const its_btnMenu = target == btnMenu;
    const menu_is_active = searcForm.classList.contains("header__search--open");

    if (!itsMenu && menu_is_active) {
      searcForm.classList.remove("header__search--open");
    }
  });

  const textpageGallerySlider = new Swiper(
    ".textpage__gallery-slider-container",
    {
      slidesPerView: 1,
      spaceBetween: 20,

      pagination: {
        el: ".textpage__gallery-slider-pagination",
        clickable: true,
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
          spaceBetween: 40,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 40,
          navigation: {
            nextEl: ".textpage__gallery-slider-next",
            prevEl: ".textpage__gallery-slider-prev",
          },
        },
      },
    }
  );

  const textpageLargeSlider = new Swiper(".textpage__large-slider", {
    slidesPerView: 1,
    spaceBetween: 20,

    pagination: {
      el: ".textpage__large-slider-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".textpage__large-slider-next",
      prevEl: ".textpage__large-slider-prev",
    },
  });

  // breakpoint where swiper will be destroyed
  // and switches to a dual-column layout
  const breakpoint = window.matchMedia("(min-width:767px)");

  // keep track of swiper instances to destroy later
  let mySwiper;

  const breakpointChecker = function () {
    // if larger viewport and multi-row layout needed
    if (breakpoint.matches === true) {
      // clean up old instances and inline styles when available
      if (mySwiper !== undefined) {
        mySwiper.destroy(true, true);
      }

      // or/and do nothing
      return;

      // else if a small viewport and single column layout needed
    } else if (breakpoint.matches === false) {
      // fire small viewport version of swiper
      return enableSwiper();
    }
  };

  const enableSwiper = function () {
    mySwiper = new Swiper(".news-slider", {
      loop: false,
      slidesPerView: 1,
      spaceBetween: 20,
      centeredSlides: true,
      a11y: true,
      pagination: {
        el: ".news-slider-pagination",
        clickable: true,
      },
    });
  };

  // keep an eye on viewport size changes
  breakpoint.addListener(breakpointChecker);

  // kickstart
  breakpointChecker();

  let i;

  // mapboxgl.accessToken =
  //   "pk.eyJ1IjoiY2FuZWtsaXMiLCJhIjoiY2tqc2g2bWk1M3pyODJ6bG9jNTlicG1qbSJ9.kAq6U0hW3k2xL5j7paZWcg";
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYXJ0c3RvcnlsYWIiLCJhIjoiY2tzNGEzeDY5MGhtcDJ2cGhtYXJuY2t5ayJ9.2lmESFBMJsMghqwvNN4QMQ";
  const map = new mapboxgl.Map({
    container: "poimapbox-map",
    // style: "mapbox://styles/caneklis/ckq0szt1b090317mov88jqbuh",
    style: "mapbox://styles/artstorylab/cksgdswyk6isk17p1km65n92i",

    center: [37.6136, 55.7328],
    zoom: 3,
  });

  const filters = document.querySelectorAll(".filter__item");

  filters.forEach((filter) => {
    filter.addEventListener("click", function () {
      let selectedFilter = filter.getAttribute("data-filter");
      let itemsToHide = document.querySelectorAll(
        `.mapboxgl-marker:not([data-filter='${selectedFilter}'])`
      );
      let itemsToShow = document.querySelectorAll(
        `[data-filter='${selectedFilter}']`
      );

      if (selectedFilter == "all") {
        itemsToHide = [];
        itemsToShow = document.querySelectorAll("[data-filter]");
      }

      itemsToHide.forEach((el) => {
        el.classList.add("hide");
        el.classList.remove("show");
      });

      itemsToShow.forEach((el) => {
        el.classList.remove("hide");
        el.classList.add("show");
      });
    });
  });

  // This adds the data to the map
  map.on("load", () => {
    // This is where your '.addLayer()' used to be, instead add only the source without styling a layer
    map.addSource("places", {
      type: "geojson",
      data: places,
    });
    // Initialize the list
    buildLocationList(places);
    // buildYearsList(years);
  });

  // This is where your interactions with the symbol layer used to be
  // Now you have interactions with DOM markers instead
  places.features.forEach(function (marker, i) {
    // Create an img element for the marker
    let el = document.createElement("div");
    el.id = "poimapbox-marker-" + i;
    el.className = `poimapbox-marker  marker  ${marker.properties.type}`;
    el.setAttribute("data-filter", `${marker.properties.type}`);
    el.setAttribute("data-year", `${marker.properties.year}`);
    // Add markers to the map at all points
    new mapboxgl.Marker(el, { offset: [0, 0] })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);

    el.addEventListener("click", function (e) {
      // 1. Fly to the point
      flyToPark(marker);

      // 2. Close all other popups and display popup for clicked Park
      createPopUp(marker);

      document.querySelector(".years").classList.add("years--hide");

      // 3. Highlight listing in sidebar (and remove highlight for all other listings)
      let activeItem = document.getElementsByClassName("active");

      e.stopPropagation();
      if (activeItem[0]) {
        activeItem[0].classList.remove("active");
      }

      let listing = document.getElementById("listing-" + i);
      listing.classList.add("active");
    });
  });

  function flyToPark(currentFeature) {
    map.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15,
    });
  }

  function createPopUp(currentFeature) {
    let popUps = document.getElementsByClassName("mapboxgl-popup");
    if (popUps[0]) {
      popUps[0].remove();
    }

    let popupImg =
      currentFeature.properties.image != null
        ? `${currentFeature.properties.image}`
        : "";

    let popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML(
        `
          <div class="mapboxgl__custom-content  mapboxgl__custom-content--${currentFeature.properties.type}" >
            <div class="mapboxgl__custom-content-head">
              <h3>${currentFeature.properties.name}</h3>
              <p>${currentFeature.properties.subtitle}</p>
            </div>
            <div class="mapboxgl__custom-content-media">
              <img src="${currentFeature.properties.image}">
            </div>
            <div class="mapboxgl__custom-content-text">
              ${currentFeature.properties.info}
            </div>
          </div>
        `
      )
      .addTo(map);
    popup.on("close", () => {
      document.querySelector(".years").classList.remove("years--hide");
    });

    document.querySelector(".mapboxgl-popup-close-button").innerHTML = `
    <svg width="9" height="27" viewBox="0 0 9 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.37536 0.110007C8.10874 -0.0133388 7.79996 -0.0338504 7.51695 0.052984C7.23394 0.139818 6.99988 0.326886 6.86626 0.573038L0.119162 13.0313C0.040802 13.1756 0 13.3349 0 13.4964C0 13.6579 0.040802 13.8171 0.119162 13.9615L6.86626 26.4197C6.93172 26.5427 7.0229 26.6525 7.13453 26.7428C7.24617 26.833 7.37605 26.902 7.5167 26.9457C7.65735 26.9895 7.80599 27.007 7.95403 26.9975C8.10207 26.9879 8.2466 26.9514 8.37928 26.89C8.51196 26.8286 8.63017 26.7436 8.72709 26.6398C8.82401 26.5361 8.89772 26.4156 8.94398 26.2854C8.99024 26.1552 9.00812 26.0179 8.99661 25.8813C8.9851 25.7447 8.94441 25.6115 8.8769 25.4895L2.38394 13.4964L8.8769 1.50325C9.0105 1.25709 9.03272 0.972019 8.93866 0.710737C8.84461 0.449455 8.64198 0.233367 8.37536 0.110007Z" fill="#5896A3"/>
    </svg>

    `;
  }

  function buildLocationList(data) {
    for (i = 0; i < data.features.length; i++) {
      let currentFeature = data.features[i];

      let listings = document.getElementById("poimapbox-listings");
      let listing = listings.appendChild(document.createElement("li"));
      listing.className = "amenity-poi";
      listing.id = "listing-" + i;

      let link = listing.appendChild(document.createElement("a"));
      link.href = "#";
      link.className = "name";
      link.dataPosition = i;
      link.innerHTML = `
        <h3>${currentFeature.properties.name}</h3>
        <p>${currentFeature.properties.subtitle}</p>
      `;

      link.addEventListener("click", function (e) {
        // Update the currentFeature to the Park associated with the clicked link
        let clickedListing = data.features[this.dataPosition];

        // 1. Fly to the point
        flyToPark(clickedListing);

        // 2. Close all other popups and display popup for clicked Park
        createPopUp(clickedListing);

        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
        let activeItem = document.getElementsByClassName("amenity-poi active");

        if (activeItem[0]) {
          activeItem[0].classList.remove("active");
        }
        this.parentNode.classList.add("active");

        document
          .querySelector(".poimapbox-sidebar")
          .classList.remove("poimapbox-sidebar--active");
        document.querySelector(".mapboxgl__search-form-toggle").style.display =
          "block";
        document.querySelector(".years").classList.add("years--hide");
      });
    }
  }

  const filtersYears = document.querySelectorAll(".years__item");

  filtersYears.forEach((filter) => {
    filter.addEventListener("click", function () {
      filtersYears.forEach((item) => {
        item.classList.remove("years__item--active");
      });

      this.classList.add("years__item--active");
      // this.classList.add('years__item--active');
      let selectedFilter = filter.getAttribute("data-year");
      let itemsToHide = document.querySelectorAll(
        `.mapboxgl-marker:not([data-year='${selectedFilter}'])`
      );
      let itemsToShow = document.querySelectorAll(
        `[data-year='${selectedFilter}']`
      );

      itemsToHide.forEach((el) => {
        el.classList.add("hide");
        el.classList.remove("show");
      });

      itemsToShow.forEach((el) => {
        el.classList.remove("hide");
        el.classList.add("show");
      });
    });
  });
  // }, 1000);

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));

  document
    .querySelector(".mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon")
    .insertAdjacentHTML(
      "afterbegin",
      `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 2V28" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="round"/>
    <path d="M2 15L28 15" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="round"/>
    </svg>`
    );
  document
    .querySelector(".mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon")
    .insertAdjacentHTML(
      "afterbegin",
      `<svg width="30" height="4" viewBox="0 0 30 4" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2L28 2" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="round"/>
    </svg>
    `
    );

  const filterList = document.querySelector("#menu");
  document
    .querySelector(".mapboxgl-ctrl-bottom-right")
    .insertAdjacentElement("afterbegin", filterList);

  const activateFilterBtn = document.querySelector(".filter__btn");
  activateFilterBtn.addEventListener("click", () => {
    activateFilterBtn.classList.toggle("filter__btn--active");
    document
      .querySelector(".filter__list")
      .classList.toggle("filter__list--active");
  });

  const searchFormBtn = document.querySelector(".mapboxgl__search-form-toggle");

  searchFormBtn.addEventListener("click", () => {
    document
      .querySelector(".poimapbox-sidebar")
      .classList.add("poimapbox-sidebar--active");
    searchFormBtn.style.display = "none";
    // searchFormBtn.classList.toggle("mapboxgl__search-form-toggle--active");
    // if (
    //   searchFormBtn.classList.contains("mapboxgl__search-form-toggle--active")
    // ) {
    //   searchFormBtn.innerHTML = `
    //   <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    //     <use href="images/sprite_auto.svg#cross"/>
    //   </svg>
    // `;
    // } else {
    //   searchFormBtn.innerHTML = `
    //   <svg viewBox="0 0 30 10" xmlns="http://www.w3.org/2000/svg">
    //     <use href="images/sprite_auto.svg#search"/>
    //   </svg>
    // `;
    // }
  });

  const closeSidebarBtn = document.querySelector(
    ".poimapbox-sidebar__close-btn"
  );

  closeSidebarBtn.addEventListener("click", () => {
    document
      .querySelector(".poimapbox-sidebar")
      .classList.remove("poimapbox-sidebar--active");
    searchFormBtn.style.display = "block";
  });

  document
    .querySelector("#search-input")
    .addEventListener("input", filterPlacesList);
  function filterPlacesList() {
    // Declare variables
    let input;
    let filter;
    let ul;
    let li;
    let a;
    let i;
    let txtValue;
    input = document.getElementById("search-input");
    filter = input.value.toUpperCase();
    ul = document.getElementById("poimapbox-listings");
    li = ul.getElementsByClassName("amenity-poi");

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
      a = li[i].getElementsByTagName("a")[0];
      txtValue = a.textContent || a.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        li[i].style.display = "";
        li[i].classList.remove("fadeOut");
      } else {
        li[i].classList.add("fadeOut");
        li[i].style.display = "none";
      }
    }
  }

  function RecurringTimer(callback, delay) {
    let timerId;
    let start;
    let remaining = delay;

    this.pause = function () {
      window.clearTimeout(timerId);
      remaining -= new Date() - start;
    };

    var resume = function () {
      start = new Date();
      timerId = window.setTimeout(function () {
        remaining = delay;
        resume();
        callback();
      }, remaining);
    };

    this.resume = resume;

    this.resume();
  }

  const playBtn = document.querySelector(".years-play-btn");
  const stopBtn = document.querySelector(".years-stop-btn");
  const resumeBtn = document.querySelector(".years-resume-btn");
  playBtn.addEventListener("click", () => {
    playBtn.classList.add("years-play-btn--hide");
    stopBtn.classList.remove("years-stop-btn--hide");
    let timer;
    timer = new RecurringTimer(function () {
      let elems = document.querySelectorAll(".years__item");

      if (i <= elems.length) {
        index = index % elems.length;
        elems[index++].click();
      }
    }, 1000);

    let index = 0;

    stopBtn.addEventListener("click", () => {
      timer.pause();
      stopBtn.classList.add("years-stop-btn--hide");
      resumeBtn.classList.remove("years-resume-btn--hide");
      // timer = null;
    });

    resumeBtn.addEventListener("click", () => {
      stopBtn.classList.remove("years-stop-btn--hide");
      resumeBtn.classList.add("years-resume-btn--hide");
      timer.resume();
      // timer = null;
    });
  });

  // function set(e) {
  //   //  Target the image ID (img_prev)          (Filter)
  //   // document.getElementById('img_prev').style["webkitFilter"] = "sepia("+e.value+")";
  //   // document.getElementById('Amount').innerHTML="("+e.value+")";
  //   console.log(e.value);
  // }

  // const range = document.querySelector("#sepia");
  // range.addEventListener("change", () => {
  //   set(range);
  // });

  const range = document.getElementById("range");
  const scale = (num, in_min, in_max, out_min, out_max) => {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  };

  range.addEventListener("input", (e) => {
    const value = +e.target.value;
    const label = e.target.nextElementSibling;
    const rangeWidth = getComputedStyle(e.target).getPropertyValue("width");
    const labelWidth = getComputedStyle(label).getPropertyValue("width");
    // remove px
    const numWidth = +rangeWidth.substring(0, rangeWidth.length - 2);
    const numLabelWidth = +labelWidth.substring(0, labelWidth.length - 2);
    const max = +e.target.max;
    const min = +e.target.min;
    const top =
      value * (numWidth / max) -
      numLabelWidth / 2 +
      scale(value, min, max, 10, -10);
    label.style.top = `${top + 5}px `;
    label.innerHTML = value + 1892;
    label.setAttribute("data-year", value + 1892);

    let selectedFilter = label.getAttribute("data-year");
    let itemsToHide = document.querySelectorAll(
      `.mapboxgl-marker:not([data-year='${selectedFilter}'])`
    );
    let itemsToShow = document.querySelectorAll(
      `[data-year='${selectedFilter}']`
    );

    itemsToHide.forEach((el) => {
      el.classList.add("hide");
      el.classList.remove("show");
    });

    itemsToShow.forEach((el) => {
      el.classList.remove("hide");
      el.classList.add("show");
    });
  });
});
