import Cycle from '@cycle/xstream-run';
import xs from 'xstream';
import debounce from 'xstream/extra/debounce';
import {div, label, input, hr, ul, li, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  // Requests for Github repositories happen when the input field changes,
  // debounced by 500ms, ignoring empty input field.
  const searchRequest$ = sources.DOM.select('.field').events('input')
    .compose(debounce(500))
    .map(ev => ev.target.value)
    .filter(query => query.length > 0)
    .map(q => ({
      url: `https://api.github.com/search/repositories?q=${encodeURI(q)}`,
      category: 'github',
    }));

  // Requests unrelated to the Github search. This is to demonstrate
  // how filtering for the HTTP response category is necessary.
  const otherRequest$ = xs.periodic(1000).take(2)
    .mapTo({url: 'http://www.google.com', category: 'google'});

  // Convert the stream of HTTP responses to virtual DOM elements.
  const vtree$ = sources.HTTP.select('github')
    .flatten()
    .map(res => res.body.items)
    .startWith([])
    .map(results =>
      div([
        label('.label', 'Search:'),
        input('.field', {attrs: {type: 'text'}}),
        hr(),
        ul('.search-results', results.map(result =>
          li('.search-result', [
            a({attrs: {href: result.html_url}}, result.name)
          ])
        ))
      ])
    );

  const request$ = xs.merge(searchRequest$, otherRequest$);

  return {
    DOM: vtree$,
    HTTP: request$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});
