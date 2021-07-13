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
  const words = text.split(/\s/);

  const results = [];
  for (let city of citiesMap.keys()) {
    if (city.has(text)) {
      const result = citiesMap.get(city);
      result.exactMatch = clean(result.name) == text;
      results.push(result);
    }
  }
  for (let city of citiesMap.keys()) {
    const match = words.some(w => city.has(w));
    if (match) {
      const result = citiesMap.get(city);
      results.push(result);
    }
  }
  return results
    .map(({country, ...rest}) => ({country: countryCodes.find(({ISO}) => ISO == country), ...rest}))
    .sort((a,b) => (b.exactMatch - a.exactMatch) || (b.population - a.population));
}

// module.exports("paris 19");
