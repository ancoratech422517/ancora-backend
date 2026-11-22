# Âncora Ecommerce — Plano de implementação

## Objectivo
Criar uma homepage de ecommerce profissional e responsiva para descoberta de produtos, com catálogo, pesquisa, filtros, favoritos, carrinho lateral, benefícios de confiança e microinterações. A primeira entrega usa conteúdo mockado localmente, preparado para a futura ligação a Shopify/checkout e a produtos reais.

## Implementação
- React + TypeScript + Vite no starter web-db-user já inicializado.
- Estado de interface local em `Home.tsx`: categoria, pesquisa, favoritos, carrinho, menu mobile e feedback de acções.
- Componentes de UI pequenos e acessíveis em `Home.tsx`, sem depender de chamadas de API para a demo.
- Configuração de runtime gerida pela plataforma com `pnpm dev`, servida na porta 3000.
- Manifesto de rotas estático em `public/manus-routes.json`.
- Backend e base de dados permanecem ligados no projecto para a próxima fase de catálogo, contas, checkout e inventário.

## Estrutura principal
- `client/src/pages/Home.tsx`: loja, catálogo, filtros, hero, carrinho e estados interativos.
- `client/src/index.css`: sistema visual, responsividade, animações e tokens teal/preto/branco.
- `client/src/App.tsx`: router da homepage e fallback 404.
- `public/manus-routes.json`: rotas declaradas para a plataforma.
- `drizzle/schema.ts`, `server/`: base de dados e API preparadas para evolução.

## Direcção visual

### Estilos considerados
- Editorial teal / luxo acessível — probabilidade 0.07.
- Brutalismo suave de marketplace — probabilidade 0.04.
- Minimalismo escandinavo com alto contraste — probabilidade 0.06.

### Escolha: Editorial teal / luxo acessível

**Design Movement:** direcção editorial contemporânea, com grelha assimétrica, grandes blocos de cor e fotografia de produto tratada como capa de revista.

**Princípios:** confiança antes da pressão; clareza com personalidade; ritmo visual por contraste; movimento subtil que recompensa a exploração.

**Filosofia de cor:** teal profundo é o código proprietário da marca — transmite calma, qualidade e orientação. Branco cria espaço e leveza. Preto dá densidade, legibilidade e sensação premium.

**Paradigma de layout:** cabeçalho compacto, hero dividido em dois planos com copy editorial de um lado e produto do outro, seguido de secções horizontais e uma banda de confiança em vez de uma grelha centralizada genérica.

**Elementos assinatura:** o selo circular "curadoria Âncora"; contornos finos e raios grandes; pequenos indicadores numerados para guiar a leitura.

**Interacção:** cada gesto deve ser imediato e discreto — filtros deslizam, favoritos confirmam-se com escala curta e o carrinho entra de lado sem interromper a página.

**Animação:** entrada stagger de blocos, hover com leve elevação e zoom de imagem, ticker horizontal lento e drawer do carrinho com spring suave. Respeitar `prefers-reduced-motion`.

**Tipografia:** `DM Sans` para texto, navegação e produto; `Space Grotesk` para headlines compactas e com personalidade. Hierarquia com títulos de 56–76 px desktop e 40–48 px mobile.

**Essência da marca:** uma loja digital para objectos bem escolhidos — comprar menos, escolher melhor, viver com intenção. Personalidade: segura, curiosa, exigente.

**Voz:** directa, calorosa e conhecedora. Headlines: “Escolhas que ficam.” CTA: “Explorar a edição”.

**Wordmark & logo:** wordmark “Âncora” com o acento como elemento de navegação; símbolo simplificado de âncora formado por um U teal com ponto central.

**Cor assinatura:** `#0D9488` (Teal Âncora).

## Dados mockados
Produtos de lifestyle, casa, tecnologia, moda e bem-estar com imagens remotas de Unsplash, preços em euros, badges e avaliações. Nenhuma compra real é processada nesta versão.

## Próxima evolução
Ligação da área de produtos à base de dados/Shopify, autenticação, checkout, inventário, encomendas e backoffice de vendedores.
