import functions from './builtInFunctions'

type State = 'string' | 'decimal' | 'number' | 'ident' | 'idle'

type Token = {
  type: 'OPERAND' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'ERROR' | 'END'
  value: boolean | number | string | string[]
  start: number
  end: number
  precedence?: number
  error?: string
  depth?: number
}

type ExpressionCache = {
  tokens: Token[]
  empty: boolean
  synError: boolean
  semError?: string
}

function isDigit(char: string) {
  return '0' <= char && char <= '9'
}
function isLetter(char: string) {
  return ('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || char === '_'
}

function tokenize(expr: string) {
  let pos = 0
  let peek = expr.at(pos)
  let state: State = 'idle'
  let start = -1
  let errorFound = false
  let currentString: string[] = []
  let esc = false

  const tokens: Token[] = []

  const addOperandToken = (dataType?: 'b' | 'n' | 's') => {
    let value
    if (dataType === 'b') value = expr.at(start) === 'T'
    else if (dataType === 'n') value = +expr.substring(start, pos)
    else if (dataType === 's') value = currentString.join('')
    else value = expr.substring(start, pos).split('.')
    tokens.push({ type: 'OPERAND', value, start, end: pos })
  }
  const addErrorToken = (value: string) => {
    tokens.push({ type: 'ERROR', value, start, end: pos })
    errorFound = true
  }

  while ((peek = expr.at(pos++))) {
    if (state === 'string') {
      if (esc) {
        esc = false
        currentString.push((peek === 'n' && '\n') || (peek === 't' && '\t') || peek)
        continue
      }
      if (peek === '\\') {
        esc = true
        continue
      }
      if (peek !== '"') {
        currentString.push(peek)
        continue
      }
      state = 'idle'
      addOperandToken('s')
      currentString = []
    } else if (state === 'decimal') {
      if (isDigit(peek)) continue
      state = 'idle'
      pos--
      if (start === pos - 1) addErrorToken('.')
      else addOperandToken('n')
    } else if (state === 'number') {
      if (isDigit(peek) || (peek === '.' && (state = 'decimal'))) continue
      state = 'idle'
      pos--
      addOperandToken('n')
    } else if (state === 'ident') {
      if (isDigit(peek) || isLetter(peek) || peek === '.') continue
      state = 'idle'
      pos--
      addOperandToken()
    } else {
      start = pos - 1
      if (peek === ' ') {
      } else if (peek === '"') {
        state = 'string'
      } else if (isDigit(peek)) {
        state = 'number'
      } else if (peek === 'T' || peek === 'F') {
        const next = expr.at(pos)
        if (next && (isDigit(next) || isLetter(next) || next === '.')) state = 'ident'
        else addOperandToken('b')
      } else if (isLetter(peek)) {
        state = 'ident'
      } else if (peek === '.') {
        const next = expr.at(pos)
        if (next && isLetter(next)) state = 'ident'
        else state = 'decimal'
      } else if (peek === '>' || peek === '<' || peek === '!') {
        if (expr.at(pos) === '=') {
          tokens.push({
            type: 'OPERATOR',
            precedence: 3,
            value: peek + '=',
            start,
            end: pos + 1,
          })
          pos++
        } else if (peek !== '!') {
          tokens.push({ type: 'OPERATOR', precedence: 3, value: peek, start, end: pos })
        } else {
          addErrorToken(peek)
        }
      } else if (peek === '(') {
        tokens.push({ type: 'LPAREN', value: peek, start, end: pos })
      } else if (peek === ')') {
        tokens.push({ type: 'RPAREN', value: peek, start, end: pos })
      } else {
        const precedence =
          (peek === '^' && 7) ||
          ((peek === '*' || peek === '/' || peek === '%') && 6) ||
          ((peek === '+' || peek === '-') && 5) ||
          (peek === '=' && 4) ||
          (peek === '&' && 3) ||
          (peek === '|' && 2) ||
          (peek === ',' && 1)
        if (precedence) tokens.push({ type: 'OPERATOR', precedence, value: peek, start, end: pos })
        else addErrorToken(peek)
      }
    }
  }
  if (state !== 'idle') {
    pos--
    if (state === 'decimal' && start === pos - 1) addErrorToken('.')
    else addOperandToken(state === 'ident' ? undefined : state === 'string' ? 's' : 'n')
    if (state === 'string') {
      tokens.at(-1)!.error = 'unterminated string'
    }
  }
  tokens.push({ type: 'END', value: '', start: expr.length, end: expr.length })

  const parenStack: Token[] = []
  let previousTokenType: Token['type'] = 'ERROR' //none

  for (const token of tokens) {
    if (token.type === 'ERROR') break
    if (previousTokenType === 'OPERAND' || previousTokenType === 'RPAREN') {
      if (token.type === 'LPAREN') {
        token.value = '['
      } else if (token.type !== 'OPERATOR' && token.type !== 'RPAREN' && token.type !== 'END') {
        errorFound = true
        token.error = 'operator expected'
      }
    } else {
      if (token.type !== 'OPERAND' && token.type !== 'LPAREN') {
        if (
          !(
            token.type === 'RPAREN' &&
            previousTokenType === 'LPAREN' &&
            parenStack.at(-1)?.value === '['
          )
        ) {
          errorFound = true
          token.error = 'operand expected'
        }
      }
    }
    if (token.type === 'LPAREN') {
      token.depth = parenStack.length
      parenStack.push(token)
    } else if (token.type === 'RPAREN') {
      const lp = parenStack.pop()
      if (!lp) {
        errorFound = true
        token.type = 'ERROR'
      } else {
        token.depth = lp.depth
        if (lp.value === '[') token.value = ']'
      }
    } else if (token.type === 'OPERATOR' && token.value === ',') {
      if (parenStack.length === 0 || parenStack.at(-1)?.value !== '[') {
        errorFound = true
        token.type = 'ERROR'
      } else token.depth = parenStack.length - 1
    }

    previousTokenType = token.type
  }
  const lastTokenType = tokens.at(-2)?.type
  if (lastTokenType !== 'OPERAND' && lastTokenType !== 'RPAREN') {
    errorFound = true
  }
  if (parenStack.length !== 0) {
    errorFound = true
    for (const paren of parenStack) paren.error = 'unclosed'
  }

  return { tokens, errorFound }
}

function tokensToPostfix(tokens: Token[]) {
  const stack: Token[] = []
  const result: Token[] = []
  let previousTokenType: Token['type'] = 'ERROR' //none
  for (const token of tokens) {
    if (token.type === 'OPERAND') {
      result.push(token)
    } else if (token.type === 'LPAREN') {
      if (token.value === '[') {
        while (stack.length > 0 && (stack.at(-1)?.precedence ?? 0) >= 8) result.push(stack.pop()!)
        stack.push({
          type: 'OPERATOR',
          start: token.start,
          end: token.end,
          value: '',
          precedence: 8,
        }) // call operator
      }
      stack.push(token)
    } else if (token.type === 'RPAREN') {
      let top: Token
      while ((top = stack.pop()!)) {
        if (top.type === 'LPAREN') break
        result.push(top)
      }
      if (previousTokenType === 'LPAREN')
        result.push({ type: 'OPERAND', start: token.start, end: token.start, value: '' }) // no params
    } else if (token.type === 'OPERATOR') {
      while (stack.length > 0 && (token.precedence ?? 0) <= (stack.at(-1)?.precedence ?? 0))
        result.push(stack.pop()!)
      stack.push(token)
    }
    previousTokenType = token.type
  }
  while (stack.length > 0) result.push(stack.pop()!)

  return result
}

function calc(operator: string, a: any, b: any) {
  switch (operator) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '*':
      return a * b
    case '/':
      return a / b
    case '%':
      return a % b
    case '^':
      return Math.pow(a, b)
    case '=':
      return a === b
    case '!=':
      return a !== b
    case '>':
      return a > b
    case '<':
      return a < b
    case '<=':
      return a <= b
    case '>=':
      return a >= b
    case '&':
      return a && b
    case '|':
      return a || b
    case ',':
      if (typeof a === 'object') return a.push(b) && a
      return [a, b]
    case '':
      if (typeof a !== 'function') return undefined
      if (typeof b === 'object') return a(...b)
      return a(b)
  }
}

function getValueFromContext(context: Record<string, any>, key: string[], namespace?: string) {
  if (key.length === 1 && Object.hasOwn(functions, key[0])) return (functions as any)[key[0]]
  let obj: string | number | boolean | Record<string, any> = context
  for (let i = 0; i < key.length; i++) {
    let part = key[i]
    if (i === 0 && part === '' && namespace) part = namespace
    if (typeof obj === 'object' && Object.hasOwn(obj, part)) obj = obj[part]
    else return
  }
  if (
    typeof obj === 'string' ||
    typeof obj === 'number' ||
    typeof obj === 'boolean' ||
    typeof obj === 'function'
  )
    return obj
}

function solvePostfix(postfix: Token[], variables: Record<string, any>, namespace?: string) {
  const stack: any[] = []
  for (const token of postfix) {
    if (token.type === 'OPERAND') {
      stack.push(
        typeof token.value === 'object'
          ? getValueFromContext(variables, token.value, namespace)
          : token.value,
      )
    } else {
      const b = stack.pop()
      const a = stack.pop()
      const result = calc(token.value as string, a, b)
      stack.push(result)
    }
  }
  return stack.pop()
}

function evaluate(expressionTokens: Token[], variables: Record<string, any>, namespace?: string) {
  return solvePostfix(tokensToPostfix(expressionTokens), variables, namespace)
}

function createExpressionCache(expr: string) {
  const { tokens, errorFound } = tokenize(expr)
  const cache: ExpressionCache = { tokens, synError: errorFound, empty: tokens.length <= 1 }
  if (!errorFound && !tokens.some((t) => typeof t.value === 'object'))
    cache.semError = 'Expression is constant.'
  return cache
}

function hasErrors(cache: ExpressionCache, variables: Record<string, any>, namespace?: string) {
  return (
    cache.synError ||
    cache.semError ||
    cache.tokens.some(
      (t) =>
        typeof t.value === 'object' &&
        getValueFromContext(variables, t.value, namespace) === undefined,
    )
  )
}

export {
  type Token,
  type ExpressionCache,
  tokenize,
  getValueFromContext,
  evaluate,
  tokensToPostfix,
  solvePostfix,
  createExpressionCache,
  hasErrors,
}
