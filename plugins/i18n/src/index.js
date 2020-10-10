import Polyglot from 'node-polyglot';

function fetchJSON(url, done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function(e) {
        var json;
        if (xhr.status === 200) {
            json = JSON.parse(xhr.responseText);
        }
        done(json, xhr.status);
    }
    xhr.send();
}

function localeToLang(locale) { // en to en, en_US to en
    if (!locale) return null;
    var i = locale.indexOf('-');
    if (i === -1) {
        i = locale.indexOf('_'); // java locale
    }
    return i > -1 ? locale.substring(0, i) : locale;
}

function guessLanguage(defaultLang) {
    var locale = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
    if (locale) {
        return localeTolang(locale);
    }
    return defaultLang;
}

function QuteIntl(config) {
    var lang = null;
    if (!config) {
        config = { locale: lang };
    } else if (!config.locale) {
        config.locale = lang;
    } else {
        lang = localeTolang(config.locale);
    }
    this.lang = null;
    this.resources = config.resources || {};
    this.polyglot = new Polyglot(config);
    var translate = this.polyglot.t.bind(this.polyglot);
    this.t = translate;
}

QuteIntl.prototype = {
    install(Qute) {
        // install translation methods on ViewModel and functional component prototypes
        Qute.defineMethod('t', this.t);
        return this;
    },
    load(lang) {
        if (!lang) lang = 'guess';
        if (this.lang !== lang) {
            if (lang === 'guess') {
                lang = guessLanguage('en');
            }
            var phrases = this.resources[lang];
            if (typeof phrases === 'string') {
                var self = this;
                return new Promise(function(resolve, reject) {
                    fetchJSON(phrases, function(json, status) {
                        if (json) {
                            self.lang = lang;
                            //self.resources[lang] = json;
                            self.polyglot.locale(lang);
                            self.polyglot.replace(json);
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    });
                });
            } else if (phrases) {
                this.lang = lang;
                this.polyglot.locale(lang);
                this.polyglot.replace(phrases);
                return Promise.resolve(true);
            } else {
                throw new Error('No phrases found for language: '+lang);
            }
        } else {
            return Promise.resolve(false);
        }
    }
}

export default QuteIntl;

