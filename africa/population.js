/**
 * Реализация API, не изменяйте ее
 * @param {string} url
 * @param {function} callback
 */
 function getData(url, callback) {
   var RESPONSES = {
     '/countries': [
       {name: 'Cameroon', continent: 'Africa'},
       {name :'Fiji Islands', continent: 'Oceania'},
       {name: 'Guatemala', continent: 'North America'},
       {name: 'Japan', continent: 'Asia'},
       {name: 'Yugoslavia', continent: 'Europe'},
       {name: 'Tanzania', continent: 'Africa'}
     ],
     '/cities': [
       {name: 'Bamenda', country: 'Cameroon'},
       {name: 'Suva', country: 'Fiji Islands'},
       {name: 'Quetzaltenango', country: 'Guatemala'},
       {name: 'Osaka', country: 'Japan'},
       {name: 'Subotica', country: 'Yugoslavia'},
       {name: 'Zanzibar', country: 'Tanzania'},
     ],
     '/populations': [
       {count: 138000, name: 'Bamenda'},
       {count: 77366, name: 'Suva'},
       {count: 90801, name: 'Quetzaltenango'},
       {count: 2595674, name: 'Osaka'},
       {count: 100386, name: 'Subotica'},
       {count: 157634, name: 'Zanzibar'}
     ]
   };

   setTimeout(function () {
     var result = RESPONSES[url];
     if (!result) {
       return callback('Unknown url');
     }

     callback(null, result);
   }, Math.round(Math.random * 1000));
}

/*
 * Ваши изменения ниже
 */

/*
 * По второму пункту задания:
 * Добавляю возможность - диалог с пользователем.
 * Если введено данные, то показываю информацию по введенным данным,
 * если не введено, то показываю информацию по Африке.
 */

var requests = ['/countries', '/cities', '/populations'];
var responses = {};
var inputValue = prompt('Введите название страны или города', '');
var elem = document.querySelector('#js-output');

for (var i = 0; i < requests.length; i++) {
  doRequest(requests[i]);
}

function doRequest(url) {
  var callback = function(error, result) {
    var responses = [];

    if (error) {
      console.error(error);
      return false;
    }

    responses[url] = result;
    for (K in responses) {
      responses.push(K);
    }

    if (responses.length === 3) {
      var countries = [],
      var cities = [];
      var population = 0;
      var i = 0;
      var j = 0;
      var responsesLenght = responses['/cities'].length;
      var populationLenght = responses['/populations'].length;
      var countriesLenght;

      if (inputValue) {
        countries = [inputValue];
      } else {
        for (i = 0; i < responses['/countries'].length; i++) {
          if (responses['/countries'][i].continent === 'Africa') {
            countries.push(responses['/countries'][i].name);
          }
        }
      }

      countriesLenght = countries.length;

      for (i = 0; i < responsesLenght; i++) {
        for (j = 0; j < countriesLenght; j++) {
          if (responses['/cities'][i].country === countries[j]) {
            cities.push(responses['/cities'][i].name);
          }
        }
      }

      if (!cities.length) {
        cities = [inputValue];
      }

      for (i = 0; i < populationLenght; i++) {
        for (j = 0; j < cities.length; j++) {
          if (responses['/populations'][i].name === cities[j]) {
            population += responses['/populations'][i].count;
          }
        }
      }

      var message = (!inputValue) ? ('Численность населения в Африке равна: ' + population + '.') :
        !population ? ('Информация по "' + inputValue + '" отсутствуют') :
        ('Численность населения в ' + inputValue + ' равна: ' + population + '.');

      console.log(message);
    }
  };

  getData(url, callback);
}
