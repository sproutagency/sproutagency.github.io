// Define constants
const hostname = String(window.location.hostname);
const cookieParams = ['source', 'medium', 'campaign', 'term'];

// Parse cookies and return an object or a specific value
function parseCookies(cookieName) {
    const cookiesArray = document.cookie.split(";");
    let cookiesObj = {};

    for (let cookie of cookiesArray) {
        const [key, value] = cookie.trim().split("=");
        cookiesObj[key] = value;
    }

    return cookieName ? cookiesObj[cookieName] || null : cookiesObj;
}

// Set a new cookie
function setCookie(name, value, days, path, domain, secure) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (days * 864E5));
    const expires = days ? ";expires=" + expirationDate.toGMTString() : "";
    const cookiePath = path ? ";path=" + path : "";
    const cookieDomain = domain ? ";domain=" + domain : "";
    const cookieSecure = secure ? ";secure" : "";
    
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}${cookiePath}${cookieDomain}${cookieSecure}`;
}

// Write the traffic source to a cookie
function writeCookie(cookieName) {
    const trafficSource = getTrafficSource(cookieName, hostname);
    const formattedTrafficSource = unescape(trafficSource.replace(/\|{2,}/g, "|").replace(/^\|/, ""));

    setCookie(cookieName, formattedTrafficSource, 182, "/", "", "");
}

// Read a traffic source cookie and return an object
function readCookie(cookieName) {
    const cookieString = parseCookies()[cookieName];
    let cookieObj = {};

    for (let param of cookieParams) {
        cookieObj[param] = getQueryParam('?' + decodeURIComponent(cookieString), param);
    }

    return cookieObj;
}

// Convert a traffic source object to a string
function trafficSourceToString(cookieObj) {
    if (cookieObj.source === 'direct') {
        return 'direct';
    } else {
        let attrValue = `${cookieObj.source} (${cookieObj.medium}`;
        if (cookieObj.campaign.length > 1) {
            attrValue += ` | ${cookieObj.campaign}`;
        }
        if (cookieObj.term.length > 1) {
            attrValue += ` | ${cookieObj.term}`;
        }
        attrValue += ')';
        return attrValue;
    }
}

// Get a specific query parameter from a URL
function getQueryParam(url, paramName) {
    try {
        const match = url.match('[?&]' + paramName + '=([^&]+)');
        return match ? match[1] : '';
    } catch (e) {
        return '';
    }
}

// Calculate traffic source based on current URL and referrer
function calculateTrafficSource() {
    const searchEngines = [['bing', 'q'], ['google', 'q'], ['duckduckgo', 'q'], ['yahoo', 'q'], ['baidu', 'q'], ['yandex', 'q']];
    const socials = [['facebook'], ['twitter'], ['instagram'], ['pinterest'], ['youtube'], ['tiktok']];
    const ref = document.referrer.substr(document.referrer.indexOf('//') + 2);
    let refDomain = ref;
    let trafficSources = { source: '', medium: '', campaign: '', term: '' };
    const urlSearch = document.location.search;

    // Determine the source of the traffic
    if (urlSearch.indexOf('utm_source') > -1) {
        trafficSources.source = getQueryParam(urlSearch, 'utm_source');
        trafficSources.medium = getQueryParam(urlSearch, 'utm_medium');
        trafficSources.campaign = getQueryParam(urlSearch, 'utm_campaign');
        trafficSources.term = '';
    } else if (getQueryParam(urlSearch, 'gclid')) {
        trafficSources.source = 'google';
        trafficSources.medium = 'cpc';
        trafficSources.campaign = 'gclid';
        trafficSources.term = '';
    } else if (ref) {
        if (ref.indexOf('/') > -1) {
            refDomain = ref.substr(0, ref.indexOf('/'));
        }

        trafficSources.medium = 'referral';
        trafficSources.source = refDomain;

        for (let engine of searchEngines) {
            if (refDomain.includes(engine[0])) {
                trafficSources.medium = 'organic';
                trafficSources.source = engine[0];
                trafficSources.term = getQueryParam(document.referrer, engine[1]) || '';
                break;
            }
        }

        for (let social of socials) {
            if (refDomain.includes(social[0])) {
                trafficSources.medium = 'social';
                trafficSources.source = social[0];
                break;
            }
        }
    }

    return trafficSources;
}

// Build a traffic source string based on the calculated traffic source
function getTrafficSource(cookieName, hostname) {
    const trafficSources = calculateTrafficSource();
    const source = trafficSources.source || 'direct';
    const medium = trafficSources.medium || 'none';
    const campaign = (medium === 'referral') ? '' : (trafficSources.campaign || 'direct');
    const term = trafficSources.term || '';

    const value = `source=${source}&medium=${medium}&campaign=${campaign}&term=${term}`;
    return value;
}

// Create and log traffic source cookies
(function () {
    const session = parseCookies('js_referral');

    if (!session) {
        writeCookie('js_referral');
    } else {
        writeCookie('js_referral_returned');
    }
})();

const firstVisitSession = readCookie('js_referral');
const returnedVisitSession = readCookie('js_referral_returned');

if (firstVisitSession) {
    console.log(firstVisitSession);
    console.info(trafficSourceToString(firstVisitSession));
}

if (returnedVisitSession) {
    console.info(returnedVisitSession);
    console.info(trafficSourceToString(returnedVisitSession));
}

const utmSourceFirstVisit = String(firstVisitSession.source);
const utmMediumFirstVisit = String(firstVisitSession.medium);
const utmCampaignFirstVisit = String(firstVisitSession.campaign);
const searchQueryFirstVisit = String(firstVisitSession.term);
