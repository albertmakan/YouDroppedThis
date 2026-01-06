import { getValueFromContext, type Token } from '@/utils/parser'
import { defineComponent } from 'vue'

type HighlighedExpressionProps = {
  expr: string
  tokens: Token[]
  variables?: Record<string, any>
  namespace?: string
  noTooltip?: boolean
}
type Tooltip = { error?: string; warning?: string; info?: string }

export default defineComponent({
  props: ['expr', 'tokens', 'variables', 'namespace', 'noTooltip'],
  emits: ['token-click'],
  setup(props: HighlighedExpressionProps, { emit }) {
    function setTooltipPosition(x: number, y: number, c?: string) {
      const tooltip = document.getElementById('token-tooltip')
      if (!tooltip) return
      tooltip.innerText = c ?? ''
      tooltip.style.left = x + 'px'
      tooltip.style.top = y + 'px'
    }

    return () => {
      let prevEnd = 0
      const elements: any[] = []

      for (const token of props.tokens) {
        if (token.start !== prevEnd)
          elements.push(<span key={prevEnd}>{props.expr.substring(prevEnd, token.start)}</span>)

        let className = '',
          tooltip: Tooltip | undefined = token.error ? { error: token.error } : undefined
        const extractedToken = props.expr.substring(token.start, token.end)

        if (token.type === 'OPERAND') {
          let val
          if (typeof token.value === 'boolean') {
            className = 'text-code-bool'
          } else if (typeof token.value === 'number') {
            className = 'text-code-num'
          } else if (typeof token.value === 'string') {
            className = 'text-code-str'
          } else if (
            (val = getValueFromContext(props.variables ?? {}, token.value, props.namespace)) !==
            undefined
          ) {
            const t = typeof val
            if (t === 'function') className = 'text-code-fun hover:bg-code-fun-bg'
            else className = 'text-code-var hover:bg-code-var-bg'
            tooltip = { ...tooltip, info: `${extractedToken}: ${t}` }
          } else {
            className = 'text-code-warn hover:bg-code-warn-bg'
            tooltip = { ...tooltip, warning: `Name '${extractedToken}' not found` }
          }
        } else if (
          token.type === 'LPAREN' ||
          token.type === 'RPAREN' ||
          (token.type === 'OPERATOR' && token.value === ',')
        ) {
          const d = (token.depth ?? 0) % 3
          if (d === 0) className = 'text-code-bracket-1'
          else if (d === 1) className = 'text-code-bracket-2'
          else className = 'text-code-bracket-3'
        } else if (token.type === 'OPERATOR') {
          className = 'text-code-operator'
        } else if (token.type === 'ERROR') {
          className = 'text-code-error'
        }

        elements.push(
          <span class={className}>
            <span
              class={
                tooltip
                  ? 'relative z-10 ' +
                    (tooltip.error
                      ? 'underline decoration-wavy decoration-code-error decoration-[0.05em]'
                      : tooltip.warning
                        ? 'underline decoration-wavy decoration-code-warn decoration-[0.05em]'
                        : '')
                  : ''
              }
              onClick={
                tooltip &&
                (() => {
                  const onClick = (s = 0, e = 0) =>
                    emit('token-click', token.start + s, token.start + e)
                  const range = window.getSelection()?.getRangeAt(0)
                  if (range?.startContainer.nodeValue === extractedToken)
                    onClick(range.startOffset, range.endOffset)
                  else onClick()
                })
              }
              onMouseup={(e) => e.stopPropagation()}
              onMouseenter={(e) => {
                const rect = (e.currentTarget as Element)?.getBoundingClientRect()
                setTooltipPosition(
                  rect?.x ?? 0,
                  (rect?.y ?? 0) + (rect?.height ?? 0) + 2,
                  tooltip?.error || tooltip?.warning || tooltip?.info,
                )
              }}
              onMouseleave={() => setTooltipPosition(0, 0)}
            >
              {extractedToken}
            </span>
          </span>,
        )

        prevEnd = token.end
      }
      return (
        <span class="relative">
          {elements}
          {!props.noTooltip && (
            <div
              class="fixed z-20 rounded-sm bg-neutral-800 px-1 text-xs font-normal text-neutral-200"
              id="token-tooltip"
            />
          )}
        </span>
      )
    }
  },
})
