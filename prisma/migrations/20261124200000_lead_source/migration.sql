-- Необязательный снимок источника: старые заявки сохраняются без изменений.
ALTER TABLE "leads" ADD COLUMN "sourceLabel" TEXT,
ADD COLUMN "sourceButton" TEXT;