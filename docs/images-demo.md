# Демонстрационные фотографии главной

Временные снимки для вёрстки главной `app/pages/index.vue`. Заменяются фотографиями
собственного парка (Q-08 в `docs/specs/front.md`): когда появятся снимки техники, файлы
`public/landing/images/tech/*.webp` меняются один к одному, разметка не правится.

Обработка: WebP, ширина 1600 px, качество 62 (`cwebp -q 62 -m 6 -resize 1600 0`).
Источник — Wikimedia Commons (превью 1920 px).

| Файл | Что на снимке | Источник | Автор | Лицензия | Страница файла |
|---|---|---|---|---|---|
| `hero.webp` | Строительная площадка с краном и рабочей платформой | `hero-2.jpg` | Fons Heijnsbroek from Amsterdam, Netherlands | CC0 | https://commons.wikimedia.org/wiki/File:2007.08_-_%27View_over_the_metro_construction_site%27_underground_with_the_rolling_work_platform_including_building_crane_overhead;_on_the_North_side_of_Amsterdam;_Dutch_city_photo_%2B_geotag,_Fons_Heijnsbroek,_The_Netherlands_(10574456115).jpg |
| `park.webp` | Техника на площадке хранения | `base-1.jpg` | Pi.1415926535 | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Construction_equipment_in_Caltrain_yard,_September_2018.JPG |
| `podacha.webp` | Погрузка экскаватора на низкорамный трал | `delivery-1.jpg` | Roger A Smith | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:A_low_loader_collecting_a_mechanical_digger_on_Mead_Park,_Bickington_-_geograph.org.uk_-_8333289.jpg |
| `mashinist.webp` | Экскаватор в работе | `crew-1.jpg` | Andrew Diack | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:A_360%C2%B0_mechanical_excavator_working_in_Bay_80,_Eastbourne_-_geograph.org.uk_-_7993024.jpg |
| `dokumenty.webp` | Техника на площадке объекта | `base-3.jpg` | Adam Dubrowa | Public domain | https://commons.wikimedia.org/wiki/File:FEMA_-_43325_-_Construction_equipment_at_Pickins_yard_in_California.jpg |
| `remont.webp` | Ремонтные работы на объекте | `mechanic-2.jpg` | Jacob W. Frank | Public domain | https://commons.wikimedia.org/wiki/File:Maintenance_crews_work_to_repair_a_pipeline_leak_near_Canyon_Village_(34b65f90-58fe-4c6c-9746-66a328495561).jpg |
| `na-obekte.webp` | Земляные работы на объекте | `park-1.jpg` | Lord Koxinga | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:2010_07_20560_6659_Da%27an_District,_Taipei,_Xinyi_Road,_Taipei_Metro_Xinyi_Line,_Tunnel_construction,_Bottom-up_method,_Slurry_wall,_Taiwan.JPG |
| `usluga-zemlyanye.webp` | Разработка грунта | `park-2.jpg` | Lord Koxinga | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:2010_07_20590_6662_Da%27an_District,_Taipei,_Xinyi_Road,_Taipei_Metro_Xinyi_Line,_Tunnel_construction,_Bottom-up_method,_Slurry_wall,_Taiwan.JPG |
| `usluga-vyvoz.webp` | Экскаваторы на вывозе грунта | `demolition-3.jpg` | Cjp24 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Hyundai_320_LC-9_and_220_LC-9A_excavators.jpg |
| `usluga-demontazh.webp` | Экскаваторы на демонтаже | `demolition-2.jpg` | Cjp24 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Hyundai_320_LC-9_and_220_LC-9A_(excavators).jpg |
| `usluga-planirovka.webp` | Планировка участка катком и автогрейдером | `grading-2.jpg` | Krzysztof Popławski | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Budowa_Velostrady_nr_6_-_odcinek_Katowice_Bryn%C3%B3w_-_Katowice_Bryn%C3%B3w,_wyr%C3%B3wnywarka_oraz_walec_podczas_pracy.jpg |
| `usluga-perevozka.webp` | Перевозка гусеничной техники на трале | `transport-2.jpg` | Cjp24 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Liebherr_tracked_vehicle_on_Goldhofer_trailer_-_right_view2.jpg |

## Перед публикацией

- Снимки под CC BY-SA / CC BY требуют указания автора и лицензии рядом с изображением
  либо на отдельной странице credits. Подпись макета «Фото из архива компании» к этим файлам
  не относится: до запуска фото меняются на собственные (Q-08), и тогда подпись становится верной.
- Public domain и CC0 — атрибуция не обязательна, указана для полноты.
- Файлы лежат в `public/` и отдаются как статика; сборка их не сжимает.
