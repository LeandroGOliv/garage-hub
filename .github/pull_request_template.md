## Objetivo

Descreva o objetivo deste PR de forma curta e direta, sem sub-headings (`###`), e
evite referências a arquivos/código específicos. Foque no **por quê** foi feito,
não no **como**. Se for um fix, descreva também qual era o problema.

## Issue relacionada

Referencie a issue do GitHub relacionada a este PR (ex.: `Closes #12`, que fecha
a issue automaticamente ao dar merge; ou `Relacionado a #12` se só parte dela foi
resolvida). Caso não haja issue, remova esta seção.

## O que muda

Descreva com mais detalhe as mudanças aplicadas neste PR.

## Testes (TDD)

Descreva os testes escritos **antes** da implementação e o que eles cobrem —
unitários, de integração e/ou E2E, conforme o que a mudança tocou. Se a mudança
é puramente estrutural/config (sem lógica), diga isso em vez de deixar em branco.

## Test plan

Descreva o que o revisor deve testar manualmente. Se não houver nada manual a
testar, escreva "N/A — mudança puramente estrutural; lint/typecheck cobrem."

## Tipos de mudança

Marque as opções corretas e remova as outras:

- [ ] FEATURE: novo recurso
- [ ] FIX: correção de bug
- [ ] REFACTOR: reestruturação sem mudança de comportamento
- [ ] CHORE: manutenção que não afeta funcionalidade (dependências, config)
- [ ] TEST: adição ou alteração de testes automatizados
- [ ] DOCS: alteração ou adição de documentação

## Antes de solicitar uma revisão, garanta que:

_(remova esta linha ao abrir o PR — os itens abaixo continuam)_

- [ ] Escrevi o teste antes da implementação (TDD)
- [ ] Rodei os testes e o lint relevantes (`./mvnw test` no backend;
      `pnpm build && pnpm lint` no frontend)
- [ ] Atualizei a documentação relevante (README/docs), se o comportamento ou
      setup mudou
- [ ] Fiz uma auto-revisão do meu código
