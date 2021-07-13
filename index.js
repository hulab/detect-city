const cities = require('all-the-cities')
const countryCodes = require("./countryCodes.json");

const clean = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const citiesMap = cities.reduce((acc, city) => {
  const set = new Set([clean(city.name), ...city.altName.map(alt => clean(alt).replace(/ *\[[^]*\] */g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~(){}\[\]]/g," ").replace(/\s\s+/g, ' ').trim())]);
  acc.set(set, city);
  return acc;
}, new Map());

module.exports = function (query, onlyOne = false) {
  const text = clean(query).replace(/[.,\/#!$%\^&\*;:{}=\-_`~(){}\[\]]/g," ").replace(/\s\s+/g, ' ');
  const words = text.split(/\s/);

  let results = []
  for (let city of citiesMap.keys()) {
    if (city.has(text)) {
      const result = citiesMap.get(city);
      if (onlyOne) {
        return result;
      }
      results.push(result);
    }
  }
  for (let city of citiesMap.keys()) {
    const match = words.some(w => city.has(w));
    if (match.length > 0) {
      const result = citiesMap.get(city);
      if (onlyOne) {
        return result;
      }
      results.push(result);
    }
  }
  results = results.map(({country, ...rest}) => ({country: countryCodes.find(({ISO}) => ISO == country), ...rest}));
  return onlyOne ? results[0] : results;
}

// module.exports("amalfi")
