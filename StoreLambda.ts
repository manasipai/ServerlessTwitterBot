import fetch from 'node-fetch';
import Twitter from 'twit';
import { parse, format } from 'fecha';
import { take } from 'ramda';

const URL = 'https://docs.google.com/spreadsheets/d/1OZbJNVLZ9TMXs6wJgAJfXFUGvtq2ZICzl7Vyr-gEH_8/edit#gid=0';

const T = new Twitter({
    consumer_key: 'Q5YqR5BIguqmD9GTSGD4g4U7y',
    consumer_secret: 'HmcKn9Ym5QCz9aejBXoxuFcfCsiqbU8Tp855gt1mQrMFAe5tUw',
    access_token: '1176568093276958720-XkEr0OtKVfqdLZeIeG3KEGZsZXjRjG',
    access_token_secret: 'QP3I9fxQ3AWxdB8k1VigCWjLJyqsJlnTKqfedR80mGVqz'
});

// convert Google sheets date string to javascript Date object
const cellToDate = (str: string): Date =>
    parse(`${str} -0500`, 'MM/DD/YYYY HH:mm:ss ZZ') as Date;
const formatDate = (d: Date): string => format(d, 'MMM Do @ h:mm:ssA');
const parseDate = (str: string): Date =>
    parse(`${str} -0800`, 'MMM Do @ h:mm:ssA ZZ') as Date;

// Generate text for status
const postToStatus = (post: any): string =>
    shorten(`Posted: ${formatDate(cellToDate(post.gsx$OfferDate.$t))}
Description: ${post.gsx$Offer.$t}`);


// Limit tweet length to 280
const shorten = (str: string): string =>
    str.length < 280 ? str : take(277, str) + '...';

export const tweet = async () => {
    // All postings
    const arr = await fetch(URL)
        .then(r => r.json())
        .then(obj => obj.feed.entry);

    // Date of most recent tweeted post
    const previousDate = await T.get('statuses/user_timeline', {
        count: 1
    })
        .then((r: any) => r.data[0].text.split('\n')[0].replace('Posted: ', ''))
        .then(parseDate)
        .then(res => res || new Date('2018-11-17'))
        .catch(() => new Date('2018-11-10'));

    // Postings added since last tweet
    const newPostings = arr.filter(
        (post: any) =>
            post.gsx$OfferDate.$t &&
            cellToDate(post.gsx$OfferDate.$t) > previousDate
    );

    // tweet each new posting
    for (const post of newPostings) {
        const status = postToStatus(post);
        await T.post('statuses/update', { status })
            .then((res: any) => console.log(res.data.id))
            .catch((err: Error) => console.log(err.message));
        console.log('\n', status);
    }
};
