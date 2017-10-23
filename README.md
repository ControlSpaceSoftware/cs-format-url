# cs-format-url
format url strings using a simple pattern

# Usage

```
import (formatUrl} from 'cs-format-url'

const url = 'https://www.io/foo//bar/?z=z&a=a#fragment'
const uri1 = formatUrl(url)
console.log(uri1)
// https://www.io/foo/bar?a=a&z=z#fragment

const uri2 = formatUrl(url, '?[a]#-')
console.log(uri2)
// https://www.io/foo/bar?a=a
```

# Pattern

`*` select whole uri or part
`-` omit whole uri or part
`?[param,...]` include the named parameters in the query string
`?[^param,...]` exclude the named parameters from the query string
`?-` omit query string
`#-` omit fragment string
`/-/*` omit first path segment
`/*/-` include first path segment
`/foo` match path segment - if match fails do not apply format rules
`#foo` match fragment - if match fails do not apply format rules

By default a path segment rule will only include segments that are matched.
The pattern `/foo/*/` would return `/foo/bar` given `/foo/bar/is/a/thing`.
To return the remaining path end the path rule with `*` like `/foo/*`.
