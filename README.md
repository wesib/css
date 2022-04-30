# Wesib: CSS Producer

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

This module uses a [Style Producer] for producing component styles.

A `@ProduceStyle()`-decorated property or method produces a style sheet for the component.

The produces styles are applicable to both shadow DOM, and to component without one.

A `Theme` instance available in bootstrap, definition, or component context can be used to produce styles with respect
to configured theme.

[npm-image]: https://img.shields.io/npm/v/@wesib/css.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@wesib/css
[build-status-img]: https://github.com/wesib/css/workflows/Build/badge.svg
[build-status-link]: https://github.com/wesib/css/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/f0188dcd21154b20b12686c56d80d187
[quality-link]: https://www.codacy.com/gh/wesib/css/dashboard?utm_source=github.com&utm_medium=referral&utm_content=wesib/css&utm_campaign=Badge_Grade
[coverage-img]: https://app.codacy.com/project/badge/Coverage/f0188dcd21154b20b12686c56d80d187
[coverage-link]: https://www.codacy.com/gh/wesib/css/dashboard?utm_source=github.com&utm_medium=referral&utm_content=wesib/css&utm_campaign=Badge_Coverage
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/wesib/css
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://wesib.github.io/css/
[style producer]: https://www.npmjs.com/package/@frontmeans/style-producer
