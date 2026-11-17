# Checkeys

Sistema da recepção do SEPA (UFRN) para registrar a retirada e a devolução das chaves das 17 salas, por QR Code ou NFC.
Projeto do Grupo 6 (Projetos SEPA): Allyson, Giliardo, Gustavo, Kaio, Renato e Sávio.

Esta versão é o front-end do MVP em **React + TypeScript + Material UI (Material Design)**, pronta para publicar na Vercel.
Enquanto o back-end em Spring Boot não fica pronto, os dados ficam salvos no próprio aparelho e as reservas do Módulo de Reservas são simuladas.

## O que já funciona

- **Leitura por QR Code com a câmera ao vivo.** A tela "Ler chave" abre a câmera traseira e lê o QR sozinha, sem tirar foto. Tem lanterna (quando o celular permite) e troca de câmera.
  - No Chrome do Android usa o leitor nativo do navegador.
  - Nos outros navegadores (iPhone, Firefox, computador) usa o ZXing em WebAssembly, que já vem dentro do app.
- **Leitura por NFC** (Chrome para Android): lê a tag do chaveiro, grava o código numa tag nova e vincula uma tag que já existe.
- **Retirada e devolução automáticas:** se a chave está na bancada, a leitura vira retirada; se está em uso, vira devolução.
- **Confirmação do titular:** mostra a reserva ativa (titular, matrícula, horário) e pergunta se quem está no balcão é o titular.
- **Bloqueios:** sem reserva ativa, a chave não sai. Se não for o titular, a tentativa fica registrada.
- **Atrasos:** o painel destaca as chaves que passaram do horário, e a devolução registra os minutos de atraso.
- **Painel das 17 salas, reservas do dia, histórico com filtros e busca, cadastro das chaves e folha de etiquetas para imprimir.**
- **Leitura por foto e código digitado**, para quando a câmera não estiver disponível.
- **Link direto da chave:** `https://seu-app.vercel.app/?k=CHK-C40E57` abre o sistema já lendo a chave. Na folha de etiquetas dá para gerar QR Codes com esse link, assim a câmera comum do celular abre o Checkeys direto.

Os códigos das chaves (CHK-7F3A9C, CHK-2B81D4, ...) são os mesmos da folha de etiquetas de exemplo em PDF.

## Rodar no computador

Precisa do Node.js 20 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:5173. No computador a câmera funciona em `localhost`.
No celular, a câmera e o NFC só funcionam com HTTPS. Para testar no celular, publique na Vercel (abaixo).

## Publicar na Vercel

**Pelo site (mais fácil):**

1. Suba esta pasta para um repositório no GitHub.
2. Em https://vercel.com, clique em **Add New > Project** e importe o repositório.
3. A Vercel detecta o Vite sozinha. Clique em **Deploy**.
4. Em um minuto o sistema fica no ar num endereço HTTPS como `https://checkeys.vercel.app`.

**Pelo terminal:**

```bash
npm i -g vercel
vercel        # primeira publicação (responda às perguntas)
vercel --prod # publica em produção
```

O arquivo `vercel.json` já configura o build, as rotas do React e a permissão de câmera.

## Estrutura

```
src/
  App.tsx                 rotas e link direto (?k=)
  theme.ts                tema Material (claro), paleta e cores de status
  data/seed.ts            17 salas, códigos fixos e reservas de exemplo
  data/store.tsx          estado e ações (retirar, devolver, reservas, chaves)
  data/queries.ts         regras de consulta (reserva ativa, atraso, status)
  flow/FlowProvider.tsx   o que acontece depois de uma leitura
  flow/sheets.tsx         telas de confirmação (retirada, devolução, sala, chave...)
  components/QrScanner.tsx  câmera ao vivo e leitura do QR Code
  components/NfcPanel.tsx   leitura NFC
  lib/scanner.ts          leitor de QR (nativo ou ZXing) e leitura por foto
  pages/                  Painel, Ler, Reservas, Histórico, Chaves, Etiquetas, Ajustes
```

## Ligar no back-end (Spring Boot + PostgreSQL)

As ações do arquivo `src/data/store.tsx` são os pontos de integração. Sugestão de contrato da API:

| Ação no app | Endpoint sugerido |
| --- | --- |
| Listar salas e chaves | `GET /api/chaves` |
| Consultar reserva ativa (Módulo de Reservas) | `GET /api/reservas/ativa?sala={salaId}` |
| Ler uma chave pelo código | `GET /api/chaves/codigo/{codigo}` |
| Registrar retirada | `POST /api/movimentacoes/retirada` com `{ chaveId, reservaId, metodo, operador }` |
| Registrar devolução | `POST /api/movimentacoes/devolucao` com `{ chaveId, metodo, operador }` |
| Registrar ocorrência (negada, sem reserva, desconhecida) | `POST /api/movimentacoes/ocorrencia` |
| Histórico | `GET /api/movimentacoes?sala=&pessoa=&data=` |
| Gerar novo código / vincular tag NFC | `PUT /api/chaves/{id}/codigo` e `PUT /api/chaves/{id}/nfc` |

As regras de negócio (só o titular retira, retirada só com reserva ativa, atraso não cancela a reserva) devem ficar no back-end. O front-end só mostra e confirma.

## Dados de exemplo

Em **Ajustes > Restaurar dados de exemplo**, o sistema volta ao cenário da demonstração, com horários a partir do momento atual:

- **Sala 03:** reserva ativa da Ana Beatriz (retirada).
- **Sala 14:** chave com a Júlia e reserva já encerrada (devolução com atraso).
- **Sala 12:** reserva cancelada (retirada bloqueada).
- **CHK-9A9A9A:** etiqueta que não pertence a nenhuma chave (aviso de chave não reconhecida).
