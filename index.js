const cities = require('all-the-cities')
const countryCodes = require("./countryCodes.json");

const clean = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~(){}\[\]]/g," ").replace(/\s\s+/g, ' ').trim().toLowerCase();
const citiesMap = cities.reduce((acc, city) => {
  const set = new Set([clean(city.name), ...city.altName.map(alt => clean(alt).replace(/ *\[[^]*\] */g, ""))]);
  acc.set(set, city);
  return acc;
}, new Map());

module.exports = function (query) {
  const text = clean(query);
  const words = text.split(/\s/).slice(0,10);
  const results = [];

  for (let city of citiesMap.keys()) {
    if (city.has(text)) {
      const result = citiesMap.get(city);
      result.exactMatch = clean(result.name) == text;
      result.otherWords = undefined;
      result.matchName = text.split(/\s/).map((word) => word.charAt(0).toUpperCase() + word.substring(1)).join(' ');
      result.matchPercent = 100;
      results.push(result);
    }
  }
  for (let city of citiesMap.keys()) {
    // generate all variations of words by reducing length, keeping the order
    inverted_loop: {
      for (let i = words.length - 1; i > 0; i--) {
        for (let j = 0; j <= words.length - i; j++) {
          const word = words.slice(j, j + i).join(' ');
          if (city.has(word)) {
            const result = citiesMap.get(city);
            if (results.some(res => res.cityId == result.cityId)) {
              continue;
            }
            result.exactMatch = false;
            result.otherWords = [...words.slice(0, j), ...words.slice(j+i)];
            result.matchName = word.split(/\s/).map((w) => w.charAt(0).toUpperCase() + w.substring(1)).join(' ');
            result.matchPercent = 100 * i / words.length;
            results.push(result);
            break inverted_loop;
          }
        }
      }
    }
  }
  return results
    .map(({country, ...rest}) => ({country: countryCodes.find(({ISO}) => ISO == country), ...rest}))
    .sort((a,b) => (b.exactMatch - a.exactMatch) || (b.population - a.population));
}
