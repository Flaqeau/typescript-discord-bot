import { readdirSync, readFileSync } from 'fs';
import { FluentBundle, FluentResource, FluentVariable } from '@fluent/bundle';
import path from 'path';
import { Locale, LocaleString } from 'discord.js';

const langDir = '../lang',
    fallbackLang = Locale.EnglishUS,
    globalConf = new FluentResource(readFileSync(path.join(__dirname, langDir, 'resources', 'global.ftl'), { encoding: 'utf-8' })),
    langs : {
        [key:string]: FluentBundle
    } = {};

const supportedfiles = readdirSync(path.join(__dirname, langDir)).filter(s => s.endsWith('.ftl')),
    supportedLang = supportedfiles.map(file => file.split('.')[0]) as LocaleString[];
supportedfiles.forEach(lang => {
    const bundle = new FluentBundle(lang.slice(0, -4), { useIsolating:false });
    bundle.addResource(globalConf);
    const errors = bundle.addResource(new FluentResource(readFileSync(path.join(__dirname, langDir, lang), { encoding: 'utf-8' })));
    if (errors.length) {
        console.log(`Errors parsing language: ${lang}`);
        return console.error(errors);
    }
    langs[lang.slice(0, -4)] = bundle;
});

export default function i18n(lang:Locale | LocaleString, key:string, options?: Record<string, FluentVariable>): string {

    const bundle = langs[lang];
    if (!bundle) {
        if (lang !== fallbackLang) return i18n(fallbackLang, key, options);
        return `{{${lang}}}`;
    }

    const msg = bundle.getMessage(key);
    if (!msg || !msg.value) {
        if (lang !== fallbackLang) return i18n(fallbackLang, key, options);
        console.log(`i18n - Could not resolve key: ${key}`);
        return `{{${key}}}`;
    }

    const errors : Error[] = [],
        res = bundle.formatPattern(msg.value, options, errors);
    if (errors.length) {
        console.log(`i18n - Errors with ${key}`);
        console.log(options);
        console.error(errors);
    }

    return res;
}

export function localization(key: string, options?: Record<string, FluentVariable>):Partial<Record<LocaleString, string>> {
    const res:Partial<Record<LocaleString, string>> = {};
    supportedLang.forEach((lang) => {
        res[lang] = i18n(lang, key, options);
    });

    return res;
}