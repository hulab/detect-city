const cities = require('all-the-cities')
const countryCodes = require("./countryCodes.json");

const clean = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~(){}\[\]]/g," ").replace(/\s\s+/g, ' ').trim().toLowerCase();
const citiesMap = cities.reduce((acc, city) => {
  const set = new Set([clean(city.name), ...city.altName.map(alt => clean(alt).replace(/ *\[[^]*\] */g, ""))]);
  for (const name of set) {
    const cities = acc.get(name) || [];
    cities.push(city);
    acc.set(name, cities)
  }
  return acc;
}, new Map());

module.exports = function (query) {
  const text = clean(query);
  const words = text.split(/\s/).slice(0,10);
  const results = [];

  
  if (citiesMap.has(text)) {
    const cities = citiesMap.get(text);
    cities.forEach((result) => {
      result.exactMatch = clean(result.name) == text;
      result.matchPercent = 100;
    })
    results.push(...cities);
  }
  
  // generate all variations of words by reducing length, keeping the order
    const length = words.length
    for (let i = length - 1; i > 0; i--) {
      for (let j = 0; j <= length - i; j++) {
        var word = words[j];
        for (var l = j + 1; l < j + i; l++){
          word += " " + words[l];
        }

        if (citiesMap.has(word)) {
          const cities = citiesMap.get(word);
          cities.forEach((result) => {
            if (results.some(res => res.cityId == result.cityId)) {
              return;
            }
            result.exactMatch = false;
            result.matchPercent = 100 * i / length;
            results.push(result);
          });
      }
    }
  }
  return results
    .map(({country, ...rest}) => ({country: countryCodes.find(({ISO}) => ISO == country), ...rest}))
    .sort((a,b) => (b.exactMatch - a.exactMatch) || (b.matchPercent - a.matchPercent) || (b.population - a.population));
}
