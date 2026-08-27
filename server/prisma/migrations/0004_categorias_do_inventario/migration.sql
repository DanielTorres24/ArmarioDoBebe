-- Reorganiza as categorias para o inventario real dos papas.
--
-- Cada UPDATE so mexe se o valor ainda for o antigo por omissao: se os pais
-- ja tiverem mudado o nome de uma categoria no painel, fica como esta.
-- As categorias novas (fraldas, saude) sao criadas pelo seed.

UPDATE "categories" SET "name" = 'Higiene e banho', "sort_order" = 4
  WHERE "slug" = 'higiene' AND "name" = 'Higiene e cuidados';

UPDATE "categories" SET "name" = 'Brinquedos e conforto', "sort_order" = 7
  WHERE "slug" = 'brinquedos' AND "name" = 'Brinquedos';

UPDATE "categories" SET "sort_order" = 3  WHERE "slug" = 'alimentacao' AND "sort_order" = 2;
UPDATE "categories" SET "sort_order" = 6  WHERE "slug" = 'quarto'      AND "sort_order" = 4;
UPDATE "categories" SET "sort_order" = 8  WHERE "slug" = 'passeios'    AND "sort_order" = 6;
UPDATE "categories" SET "sort_order" = 9  WHERE "slug" = 'livros'      AND "sort_order" = 7;
UPDATE "categories" SET "sort_order" = 10 WHERE "slug" = 'outros'      AND "sort_order" = 8;
