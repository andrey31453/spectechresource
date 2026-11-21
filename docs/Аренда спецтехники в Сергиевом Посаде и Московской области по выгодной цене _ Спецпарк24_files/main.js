// document.querySelector('.burger').addEventListener('click', function(){
//     this.classList.toggle('active');
//     document.querySelector('nav').classList.toggle('open');
//     document.querySelector('body').classList.toggle('no-scroll');
// })

// const menuLists = document.querySelectorAll('.item.has__children');
// if(window.innerWidth < 1280){
//   menuLists.forEach(item => {

//     const basicLink = item.children[0];
//     basicLink.addEventListener('click',function(e){
//       item.classList.toggle('active');
      
    
//     })
//   })
// }


var datepicker = new Datepicker('#datepicker');


//input form
const dropdownLists = document.querySelectorAll('.form__input-dropdown');

dropdownLists.forEach(dropdownList => {
  const ul = dropdownList.querySelector('ul');
  dropdownList.onclick = function() {   
      ul.classList.toggle('none');   
  }
});

dropdownLists.forEach(dropdownList => {
  const input = dropdownList.querySelector('input');
  const ul = dropdownList.querySelector('ul');
  const lists = dropdownList.querySelectorAll('li'); 

  lists.forEach(item => {
    item.onclick = function () {
      console.log(item.innerText)
      input.value = item.innerText;      
    }
  })
});

//swiperHome-normal (guarded: homepage catalog-v2 no longer renders these)
if (document.querySelector('.catalogSlider')) {
const catalogSlider = new Swiper('.catalogSlider', {
  slidesPerView: 3,
  spaceBetween: 0,
  loop:true,
  autoplay: {
    delay: 0, 
    disableOnInteraction: true, 
    },
  speed: 6000,
  on: {
    init() {
      
      this.el.addEventListener('mouseenter', () => {        
        this.autoplay.stop();
        this.params.speed=300;
      });
      this.el.addEventListener('mouseleave', () => {       
        this.params.speed=6000; 
        this.autoplay.start();
      });

      this.el.addEventListener('touchstart', () => {  
           
        this.autoplay.stop();
        this.params.speed=300;
      });
      // this.el.addEventListener('touchmove', () => {  
      //   console.log('ok')      
      //   this.autoplay.stop();
      //   this.params.speed=300;
      // });

      this.el.addEventListener('touchend', () => {       
        this.params.speed=6000; 
        this.autoplay.start();
      });
      // this.el.addEventListener('touchcancel', () => {       
      //   this.params.speed=6000; 
      //   this.autoplay.start();
      // });

    },

    // touchEnd(){
    //   console.log(this)
    // }
  },
  breakpoints: {
    320: {
      slidesPerView: 1,
      spaceBetween: 0,
    },
    500: {
      slidesPerView: 2,
      spaceBetween: 0
    },
    900: {
      slidesPerView: 3,
      spaceBetween: 0,
    }
  },
  
  
});
}
if (document.querySelector('.catalogSliderReverse')) {
const catalogSliderReverse = new Swiper('.catalogSliderReverse', {
  slidesPerView: 3,
  spaceBetween: 0,
  loop:true,
  autoplay: {
    delay: 0, 
    disableOnInteraction: true, 
    reverseDirection: true,
    },
  speed: 6000,
  on: {
    init() {
      this.el.addEventListener('mouseenter', () => {        
        this.autoplay.stop();
        this.params.speed=300;
      });
      this.el.addEventListener('mouseleave', () => {       
        this.params.speed=6000; 
        this.autoplay.start();
      });

      this.el.addEventListener('touchstart', () => {  
            
        this.autoplay.stop();
        this.params.speed=300;
      });

      this.el.addEventListener('touchend', () => {       
        this.params.speed=6000; 
        this.autoplay.start();
      });
    }
  },
  breakpoints: {
    320: {
      slidesPerView: 1,
      spaceBetween: 0,
    },
    500: {
      slidesPerView: 2,
      spaceBetween: 0
    },
    900: {
      slidesPerView: 3,
      spaceBetween: 0,
    }
  },
});
}

//swiper reviews
const reviewsPagStart = document.querySelector('.pagination-reviews .span-start');
const reviewsPagMid = document.querySelector('.pagination-reviews .span-middle');
const reviewsPagEnd = document.querySelector('.pagination-reviews .span-end');

  const reviewsSwiper = new Swiper('.reviewsSwiper', {
    slidesPerView: 'auto',
    spaceBetween: 20,
    loop: false,
    navigation: {
      nextEl: ".swiper-button-next.swiper-reviews-button-next",
      prevEl: ".swiper-button-prev.swiper-reviews-button-prev",
    },
    on:{
      //Если слайд последний     
      reachEnd: () => {
        reviewsPagEnd.classList.add('span-active');
        reviewsPagMid.classList.remove('span-active');
      },
     //Если слайд первый
      reachBeginning: () => {
        reviewsPagStart.classList.add('span-active');
        reviewsPagMid.classList.remove('span-active');
      },
      // Если не начальная и не конечная позиция
      fromEdge: () => {
        reviewsPagStart.classList.remove('span-active');
        reviewsPagEnd.classList.remove('span-active');
        reviewsPagMid.classList.add('span-active');
      }
    },
  });
  Fancybox.bind('[data-fancybox="rewiews"]', {
   
  });

  const parkSwiper = new Swiper('.parkSlider', {
    slidesPerView: 1.15,
    spaceBetween: 12,
    centeredSlides: false,
    // loop off: park-showcase tabs hide slides; loop breaks with filtered set
    loop: false,
    breakpoints: {
      320: {
        slidesPerView: 1.15,
        spaceBetween: 12,
      },
      560: {
        slidesPerView: 2,
        spaceBetween: 12,
      },
      768: {
        slidesPerView: 2.4,
        spaceBetween: 14,
      },
      900: {
        slidesPerView: 3,
        spaceBetween: 14,
      },
      1100: {
        slidesPerView: 4,
        spaceBetween: 14,
      },
      1280: {
        slidesPerView: 5,
        spaceBetween: 12,
      }
    },
    navigation: {
      nextEl: ".swiper-button-next.swiper-park-button-next",
      prevEl: ".swiper-button-prev.swiper-park-button-prev",
    },
    autoplay: {
      delay: 1500, 
      disableOnInteraction: true, 
      },
    speed: 1500,
    on: {
      init() {
        this.el.addEventListener('mouseenter', () => {        
          this.autoplay.stop();
          this.params.speed=300;
        });
        this.el.addEventListener('mouseleave', () => {       
          this.params.speed=1500; 
          this.autoplay.start();
        });
        
        this.navigation.nextEl[0].addEventListener('mouseenter', ()=>{
          this.autoplay.stop();
          // this.params.delay=300;
          this.params.speed=300;
        });
        this.navigation.nextEl[0].addEventListener('click', ()=>{ 
          this.params.speed=300;         
          this.slideNext();
        });
        this.navigation.nextEl[0].addEventListener('mouseleave', ()=>{
          
          this.params.speed=1500; 
          this.autoplay.start();
        });

        this.navigation.prevEl[0].addEventListener('mouseenter', ()=>{
          this.autoplay.stop();
          this.params.speed=300;
        });
        this.navigation.prevEl[0].addEventListener('click', ()=>{
          this.params.speed=300;
          this.slidePrev();
        });
        this.navigation.prevEl[0].addEventListener('mouseleave', ()=>{
          this.params.speed=1500; 
          this.autoplay.start();
        });
        
      }
    }
  });

  const partnersSlider =  new Swiper('.partnersSlider', {
    slidesPerView: 4,
    spaceBetween: 20,
    centriedSlides: true,
    allowTouchMove: false,
    loop: true,    
    autoplay: {
      delay: 0, 
      disableOnInteraction: true, 
      },
    speed: 4000,
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20,
      },
      500: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      800: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
      1000: {
        slidesPerView: 4,
        spaceBetween: 20,
      }
    },

  });
  //fancy review
 
  //swiper letters
const lettersPagStart = document.querySelector('.pagination-letters .span-start');
const lettersPagMid = document.querySelector('.pagination-letters .span-middle');
const lettersPagEnd = document.querySelector('.pagination-letters .span-end');

  const lettersSwiper = new Swiper('.lettersSwiper', {
    slidesPerView: 'auto',
    spaceBetween: 20,
    loop: false,
    navigation: {
      nextEl: ".swiper-button-next.swiper-letters-button-next",
      prevEl: ".swiper-button-prev.swiper-letters-button-prev",
    },
    on:{
      //Если слайд последний     
      reachEnd: () => {
        lettersPagEnd.classList.add('span-active');
        lettersPagMid.classList.remove('span-active');
      },
     //Если слайд первый
      reachBeginning: () => {
        lettersPagStart.classList.add('span-active');
        lettersPagMid.classList.remove('span-active');
      },
      // Если не начальная и не конечная позиция
      fromEdge: () => {
        lettersPagStart.classList.remove('span-active');
        lettersPagEnd.classList.remove('span-active');
        lettersPagMid.classList.add('span-active');
      }
    },
  });
  Fancybox.bind('[data-fancybox="letters"]', {
   
  });

//modal
Fancybox.bind('[data-fancybox]', {
  arrows: false
});  

Fancybox.bind('[data-fancybox]', {
  arrows: false
});  

//accordion
let accordions = document.querySelectorAll('.catalog_accordion_parent');
accordions.forEach(acc => {
    acc.addEventListener("click", function(e) {
        this.querySelector('.catalog_accordion').classList.toggle('active');
        let panel = this.querySelector('.catalog_accordion-panel');
        if (panel.style.maxHeight) {
          panel.style.maxHeight = null;
        } else {
          panel.style.maxHeight = panel.scrollHeight + "px";
          
        }
    });
})

function wrapTablesInResponsiveDiv(containerSelector) {
  const contentContainer = document.querySelector(containerSelector);

  if (!contentContainer) {
    console.warn(`Контейнер с селектором "${containerSelector}" не найден.`);
    return;
  }

  const tables = contentContainer.querySelectorAll('table');

  tables.forEach(table => {
    if (table.parentElement && !table.parentElement.classList.contains('table-responsive')) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('table-responsive');
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
      console.log('Таблица была обернута в div.table-responsive:', table);
    } else if (table.parentElement && table.parentElement.classList.contains('table-responsive')) {
      console.log('Таблица уже была обернута:', table);
    } else {
      console.warn('У таблицы нет родительского элемента, не могу обернуть:', table);
    }
  });
}

function ensureTableHeaders(containerSelector) {
  const contentContainer = document.querySelector(containerSelector);

  if (!contentContainer) {
    console.warn(`Контейнер с селектором "${containerSelector}" не найден.`);
    return;
  }

  const tables = contentContainer.querySelectorAll('table');

  tables.forEach(table => {
    const existingThead = table.querySelector('thead');
    if (existingThead) {
      return;
    }

    const firstRow = table.rows[0];
    if (!firstRow || firstRow.cells.length === 0) {
      return;
    }

    const newThead = document.createElement('thead');
    const newHeaderRow = document.createElement('tr');

    Array.from(firstRow.cells).forEach(cell => {
      const newTh = document.createElement('th');
      newTh.innerHTML = cell.innerHTML;
      newTh.setAttribute('scope', 'col');
      newHeaderRow.appendChild(newTh);
    });

    newThead.appendChild(newHeaderRow);

    if (table.firstChild) {
      table.insertBefore(newThead, table.firstChild);
    } else {
      table.appendChild(newThead);
    }

    firstRow.remove();
    console.log('Для таблицы была создана шапка <thead> из первой строки:', table);
  });
}

// === ОСНОВНОЙ ВЫЗОВ ДЛЯ НЕСКОЛЬКИХ СЕЛЕКТОРОВ ===
document.addEventListener('DOMContentLoaded', function() {
  const containers = ['.content', '.blog-page']; // Добавь сюда нужные селекторы

  containers.forEach(container => {
    wrapTablesInResponsiveDiv(container);
    ensureTableHeaders(container);
  });
});
document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');
    
    if (!mapElement) return;

    const mapData = mapElement.getAttribute('data-postMap');
    if (!mapData || mapData.trim() === '') return;

    // Настраиваем наблюдатель для ленивой загрузки
    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (mapElement.dataset.mapLoaded === '1') {
                    observerInstance.unobserve(mapElement);
                    return;
                }
                mapElement.dataset.mapLoaded = '1';
                // Вставляем содержимое из атрибута в блок
                mapElement.innerHTML = mapData;
                
                // Извлекаем все скрипты, если это виджет Яндекса (тег script)
                const scripts = mapElement.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const scriptTag = document.createElement('script');
                    // Копируем src, если есть
                    if (scripts[i].src) {
                        scriptTag.src = scripts[i].src;
                    } else {
                        // Копируем инлайн код
                        scriptTag.innerHTML = scripts[i].innerHTML;
                    }
                    if (scripts[i].type) scriptTag.type = scripts[i].type;
                    if (scripts[i].charset) scriptTag.charset = scripts[i].charset;
                    
                    // Добавляем скрипт в head для выполнения
                    document.head.appendChild(scriptTag);
                }

                if (typeof window.__spCropMapRsya === 'function') {
                    window.__spCropMapRsya(document);
                }

                // Прекращаем следить за блоком, карта загружена
                observerInstance.unobserve(mapElement);
            }
        });
    }, {
        rootMargin: '300px 0px' // Начинаем загрузку за 300 пикселей до того, как блок покажется на экране
    });

    observer.observe(mapElement);
});