# cs-canonical-url
transform url strings using a simple pattern

# Usage

```
import (transformUri} from 'cs-canonical-url'

const url = 'https://www.io/foo//bar/?z=z&a=a#fragment'
const uri1 = transformUri(url)
console.log(uri1)
// https://www.io/foo/bar?a=a&z=z#fragment

const uri2 = transformUri(url, '?[a]#-')
console.log(uri2)
// https://www.io/foo/bar?a=a
```

# Pattern

`*` select whole uri or part
`-` omit whole uri or part
`?[param,...]` only include named params
`?[^param,...]` only exclude named params
`?-` omit query string
`#-` omit fragment string
`/-/` omit path segment
`/*/` include path segment

By default a path segment rule will only include segments that are matched.
The pattern `/foo/*/` would return `/foo/bar` given `/foo/bar/is/a/thing`.
To return the remaining path end the path rule with `*` like `/foo/*`.

