# Garage Hub

Aplicativo pessoal para centralizar o histórico de um carro: manutenções,
troca de peças e upgrades ao longo do tempo.

**Status:** projeto em estágio inicial (scaffold). Backend e frontend
foram gerados recentemente e ainda não têm código de domínio — só a
estrutura base de cada stack.

## Stack

| Camada   | Tecnologias                                                        |
| -------- | ------------------------------------------------------------------- |
| Backend  | Java 25, Spring Boot 4.1, Spring Data JPA, PostgreSQL, Maven         |
| Frontend | React 19, Vite, TypeScript, TanStack Router/Query, Tailwind, shadcn/ui, pnpm |

## Estrutura

Repositório com dois projetos independentes lado a lado (não é um
monorepo com Turborepo/Nx):

```
garage-hub/
├── backend/    # API Spring Boot
├── frontend/   # SPA React
└── README.md
```

## Como rodar

### Backend (`backend/`)

```bash
./mvnw spring-boot:run     # sobe a API (dev)
./mvnw test                # roda os testes
./mvnw clean package       # gera o jar
```

No Windows, use `mvnw.cmd` no lugar de `./mvnw`.

### Frontend (`frontend/`)

```bash
pnpm install   # instala as dependências
pnpm dev       # sobe o servidor de dev
pnpm build     # gera o build de produção
pnpm lint      # roda o eslint
```
