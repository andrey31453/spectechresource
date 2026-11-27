BEGIN;

ALTER TABLE categories ADD COLUMN description TEXT, ADD COLUMN "colorTheme" TEXT NOT NULL DEFAULT 'WHITE';

ALTER TABLE categories ADD CONSTRAINT "categories_colorTheme_check" CHECK ("colorTheme" IN ('WHITE','ORANGE','BLACK'));

INSERT INTO categories (id,slug,title,"shortDesc",description,"colorTheme","sortOrder","isPublished","createdAt","updatedAt") VALUES ('home-category-zemlyanye-raboty','zemlyanye-raboty','Земляные работы','Снять грунт, выкопать котлован или траншею, забить сваи: экскаваторы и сваебойная техника с экипажем, доставка на объект.','Подберём экскаватор для котлована, траншеи под коммуникации или планировки участка. Если нужно подготовить свайное основание, поможем выбрать сваебойную технику под условия площадки. Учтём объём работ и доступ к месту проведения работ.','WHITE',10,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT (slug) DO NOTHING;

UPDATE equipment_types SET "categoryId"=(SELECT id FROM categories WHERE slug='zemlyanye-raboty') WHERE "categoryId" IN (SELECT id FROM categories WHERE slug IN ('zemleroynaya-tehnika','svaeboynaya-tehnika'));

INSERT INTO redirects (id,"from","to","statusCode","createdAt") SELECT 'home-category-redirect-' || slug, '/katalog/' || slug, '/katalog',301,CURRENT_TIMESTAMP FROM categories WHERE slug IN ('zemleroynaya-tehnika','svaeboynaya-tehnika') ON CONFLICT ("from") DO UPDATE SET "to"='/katalog',"statusCode"=301;

DELETE FROM categories WHERE slug IN ('zemleroynaya-tehnika','svaeboynaya-tehnika');

INSERT INTO categories (id,slug,title,"shortDesc",description,"colorTheme","sortOrder","isPublished","createdAt","updatedAt") VALUES ('home-category-pogruzka-i-podem','pogruzka-i-podem','Погрузка и подъём','Разгрузить машину, поднять груз на высоту, смонтировать конструкцию: погрузчики, автокраны, гусеничные краны и автовышки.','Поможем подобрать технику для разгрузки материалов, перемещения паллет и подачи грузов на высоту. Для монтажа конструкций предложим кран, а для обслуживания фасадов и работ на высоте — автовышку. Уточним массу груза, необходимый вылет и ограничения подъезда, чтобы подобрать подходящую машину.','ORANGE',20,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT (slug) DO NOTHING;

UPDATE equipment_types SET "categoryId"=(SELECT id FROM categories WHERE slug='pogruzka-i-podem') WHERE "categoryId" IN (SELECT id FROM categories WHERE slug IN ('pogruzochnaya-tehnika','podyomnaya-tehnika'));

INSERT INTO redirects (id,"from","to","statusCode","createdAt") SELECT 'home-category-redirect-' || slug, '/katalog/' || slug, '/katalog',301,CURRENT_TIMESTAMP FROM categories WHERE slug IN ('pogruzochnaya-tehnika','podyomnaya-tehnika') ON CONFLICT ("from") DO UPDATE SET "to"='/katalog',"statusCode"=301;

DELETE FROM categories WHERE slug IN ('pogruzochnaya-tehnika','podyomnaya-tehnika');

INSERT INTO categories (id,slug,title,"shortDesc",description,"colorTheme","sortOrder","isPublished","createdAt","updatedAt") VALUES ('home-category-dorogi-i-stroyka','dorogi-i-stroyka','Дороги и стройплощадка','Подготовить основание, уложить асфальт, залить бетон: дорожно-ремонтная и строительная техника под линейные и площадные работы.','Подберём технику для подготовки и уплотнения основания, дорожного ремонта и укладки асфальта. Для бетонных работ поможем выбрать оборудование под объём и условия подачи смеси. Можно подобрать машину как для отдельного этапа, так и для нескольких последовательных работ на площадке.','BLACK',30,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT (slug) DO NOTHING;

UPDATE equipment_types SET "categoryId"=(SELECT id FROM categories WHERE slug='dorogi-i-stroyka') WHERE "categoryId" IN (SELECT id FROM categories WHERE slug IN ('dorozhno-remontnaya-tehnika','stroitelnaya-tehnika'));

INSERT INTO redirects (id,"from","to","statusCode","createdAt") SELECT 'home-category-redirect-' || slug, '/katalog/' || slug, '/katalog',301,CURRENT_TIMESTAMP FROM categories WHERE slug IN ('dorozhno-remontnaya-tehnika','stroitelnaya-tehnika') ON CONFLICT ("from") DO UPDATE SET "to"='/katalog',"statusCode"=301;

DELETE FROM categories WHERE slug IN ('dorozhno-remontnaya-tehnika','stroitelnaya-tehnika');

INSERT INTO categories (id,slug,title,"shortDesc",description,"colorTheme","sortOrder","isPublished","createdAt","updatedAt") VALUES ('home-category-perevozki-i-kommunalka','perevozki-i-kommunalka','Перевозки и коммунальное хозяйство','Вывезти грунт и мусор, перевезти технику, прочистить сети и полить дороги: самосвалы, манипуляторы, тралы и коммунальные машины.','Поможем организовать перевозку техники и материалов, подобрать транспорт для вывоза грунта или строительного мусора. Для обслуживания территории предложим коммунальные машины для полива, уборки и прочистки сетей. При подборе учтём маршрут, объём груза и условия подъезда.','WHITE',40,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT (slug) DO NOTHING;

UPDATE equipment_types SET "categoryId"=(SELECT id FROM categories WHERE slug='perevozki-i-kommunalka') WHERE "categoryId" IN (SELECT id FROM categories WHERE slug IN ('transportnaya-tehnika','kommunalnaya-tehnika'));

INSERT INTO redirects (id,"from","to","statusCode","createdAt") SELECT 'home-category-redirect-' || slug, '/katalog/' || slug, '/katalog',301,CURRENT_TIMESTAMP FROM categories WHERE slug IN ('transportnaya-tehnika','kommunalnaya-tehnika') ON CONFLICT ("from") DO UPDATE SET "to"='/katalog',"statusCode"=301;

DELETE FROM categories WHERE slug IN ('transportnaya-tehnika','kommunalnaya-tehnika');

COMMIT;
