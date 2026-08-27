-- Limpa os dados de demonstracao, para o seed poder carregar o inventario
-- real dos papas (inventario_dos_pais.txt).
--
-- Porque e uma migracao e nao um script: as migracoes correm uma unica vez,
-- automaticamente, e antes do seed no comando de build. No plano gratuito do
-- Render nao ha Shell para correr nada a mao.
--
-- So apaga artigos SEM DONO (owner_id IS NULL), ou seja, os que o seed criou.
-- Tudo o que os convidados tenham acrescentado tem owner_id preenchido e fica
-- intacto. As reservas desses artigos desaparecem por cascata.

DELETE FROM "items" WHERE "owner_id" IS NULL;

-- Sugestoes e preferencias sao inteiramente geridas pelo seed, que as recria
-- a seguir a partir das falhas reais do inventario.
DELETE FROM "suggestions";
DELETE FROM "parent_preferences";
