const path = require('path');
const fse = require('fs-extra');
const { NFTStorage, Blob } = require('nft.storage');
require('dotenv').config({ path: './.env' });

const needle = require('needle');
const XTOKEN = process.env.XTOKEN;;
const NFT_STORAGE_TOKEN = process.env.NFT_TOKEN;
const IPFS = new NFTStorage({ token: NFT_STORAGE_TOKEN });

const ROOT = path.join(__dirname, 'data');

const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

const formatDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}`;
}

async function getFoundation(url, useCache) {

    const hash = cyrb53(url.toLowerCase());
    console.log('FOUNDATION URL: ', url)

    const cacheFile = path.join(ROOT, 'foundation', `${hash}.json`);
    if (fse.existsSync(cacheFile) && useCache) {
        return fse.readJSONSync(cacheFile);
    }

    const res = await fetch(url);
    const body = await res.text();
    const begin = '<script id="__NEXT_DATA__" type="application/json">';
    const index = body.indexOf(begin);
    let data = body.substring(begin.length + index);
    data = data.substring(0, data.indexOf('</script>'));
    const json = JSON.parse(data).props.pageProps;

    let retVal = {};

    try {
        const retObj = {
            marketplace: 'foundation'
        };
        if (json.type === 'EDITION') {
            retObj.price = json.collection.mintPrice;
            retObj.thumbUrl = json.collection.assetUrl;
        } else if (json.type === 'DROP') {
            retObj.price = json.collection.mintPrice;
            retObj.thumbUrl = json.collection.collectionImageUrl;
        } else {
            retObj.price = json.artwork.activeSalePriceInETH;
            retObj.thumbUrl = `${json.artwork.assetScheme}${json.artwork.assetHost}${json.artwork.assetPath}`;
        }

        if (!retObj.price) {
            if (json.artwork.buyNows && Array.isArray(json.artwork.buyNows)) {
                retObj.price = json.artwork.buyNows[0].amountInETH;
            }
        }
        console.log('FOUNDATION price', retObj.price);
        retVal = retObj;
        fse.writeJSONSync(cacheFile, retVal);
    } catch (e) {
        console.log('FOUNDATION', url, e.message);
        retVal = {
            error: e.message + ': ' + url
        }

    }
    return retVal;
}

async function getObjkt(url, useCache) {

    const hash = cyrb53(url.toLowerCase());
    console.log('OBJKT URL: ', url)

    const cacheFile = path.join(ROOT, 'objkt', `${hash}.json`);
    if (fse.existsSync(cacheFile) && useCache) {
        return fse.readJSONSync(cacheFile);
    }

    const frags = url.split('/');
    const contract = frags[frags.length - 2];
    let token = frags[frags.length - 1];
    if (token.indexOf('?') > -1) {
        token = token.split('?')[0];
    }
    const res = await fetch(
        "https://data.objkt.com/v3/graphql",
        {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                query: `{
                    fa(where: {contract: {_eq: "${contract}"}}) {
                      tokens(where: {token_id: {_eq: "${token}"}}) {
                        supply
                        listings_active {
                          price_xtz
                        }
                        thumbnail_uri
                      }
                    }
                  }`
            }
            )
        }
    );
    const resJson = await res.json();
    let retVal = {};
    // console.log('OBJKT response', JSON.stringify(resJson,null,2));
    try {
        let priceXtz = resJson.data.fa[0].tokens[0].listings_active[0].price_xtz;

        resJson.data.fa[0].tokens[0].listings_active.forEach((l) => {
            if (l.price_xtz < priceXtz) {
                priceXtz = l.price_xtz;
            }
        });
        const price = priceXtz / 1000000;
        console.log('OBJKT price', price);

        retVal = {
            marketplace: 'objkt',
            price,
            thumbUrl: resJson.data.fa[0].tokens[0].thumbnail_uri.replace('ipfs://', 'https://nftstorage.link/ipfs/')
        }
        fse.writeJSONSync(cacheFile, retVal);
    } catch (e) {
        console.log('OBJKT', url, resJson, e.message);
        //        console.log(JSON.stringify(resJson, null, 2));
        retVal = {
            error: e.message + ': ' + url
        }
    }
    return retVal;
}

async function getTwitterUsers() {
    const sortedUsers = ["___Philosopher_","_vasicovska_","TheKairePius","0xjpegz_eth","1000___Words","4FS4N","a1367h","adrian_brunda","aftabprasla","agatha_eden1","AGrebeshkova","AHHingoro","AICrtvCircuit","akman42mehmet","akurami_","alevART_eth","alexey93kmnchk","Alexshark84","AlienExperienc3","alirezaajafari","alwayssunny112","ambi_eth","amiirshafii","amnach_ch","AnastasiaNFTart","anna_xoxol","annakuss3","anni07__","AparnaMondalNFT","ApricotBlossomD","Arastoo4dTeam","ardavan_","ariandarbandi1","arianr_","arijitmondal1","arimitaNFT","ArmandaBlum","artago_","Artago_","artbygulsen","artelladoteth","ArtHkh","Artnaz_eth","artsophiakuehn","artyxssss","arunnalimela","AsayeshRoya","ashkiran252","AtefatG","aterban158","AyazYildiz_","Babarobot_","bagenblagen","bahaar_hamdami","bahar_psh19","banafsheh_Ph","bank_1819","BaranJavidan","BarbaraBezina","BavisaJeenal","behroozdaavari","BeriziFatemeh","Bitaemm","bitua388_bitua","BohoArtRunway","boxio3","brijessh","BrilliantartNFT","businessneeds3","candanart","Cassi_Moghan","chepurnyh_","Crutnix","cryptocitygang","Cuadros_cinthia","dani_phstories","danielchideraa","demi_nataly","deriniti","Diba_Adib_art","DirisMalko","DKANARY27","dollykabaria","dornartz","DortheJOC","dreamhelenarts","durjoy_nft","EFuriosity","Ela_artNFT","elena_croArt","EmanuelAlqm","Eshtiaghi_M","f9artist","Faavidel","faezehrahimi15","faezehrahimi15","Faezenasaj","FaezeOstad","farazelahian","farzanehmajidi","fawnarts_nft","FereshtehFarma3","ffox_vox","firelorrdArt","FotoGraaGH","FreaklandMamma","Ghazalartt","Golbarg_art","Golden_Artss","graphicurve","greenparadise98","grotes_q","growthrev","hadismohammad12","HanizHamdami","happyantsstudio","happyshima","hbvarun_beetle","hdasha_art","HeleDsNFT","HollyPollyArt","iamsajii","ijlalaslam","imed_kolli","irkaevaart","itsFaMeta","itshokufeh","itshokufeh","ItsNaastaaraan","Ize_Art0","jan_studio8","JaspiroNFTs","jayjay__92","jeleyinte","jis0rder","john_daniel_nft","johnny_olaleye","kamelialahijani","KarishmaBagla","keerigirl","KhuranaVedika","kiran46_eth","kosaramiri_eth","krisuvarova2018","liapsart","Lilitaart","Liliyaarts","Lily_art1","LinaZakirina","LinImelda","livingarts_eth","Liz_nfts","lovaniceth","MaddolphNFT","magicalords","mahnazsaadatkia","Mahsa_se_nft","MahsaAli_art","MahsaFzr","mahtaabfatemi","mahya_afkhami","majimagart","malinca_art","MAmurvelashvili","manisaemi","maradg86","mardinahmadi","MariArt00777","masisus","Mathouttt","matifo970","MattNFTartist","MaziSaeidi","medinnft","Medvedica_2017","MeMyTrivia1","MerinMiler","metamorphix_nft","micca_art","MichaelEnechi","miiladmoghadam","MikeHalasa","Minalisa1991","Minas_Sanim","minoo_eth","MKG4752","mohade3_nft","MonikaNFT","MonsterRafo","moon__theater","MoonaLuna_eth","mosio_eth","MrsUnbreakablee","mshartistry","Mustydraws","mystery_nft1","Narciss369","nastaranartmix2","natariaaa","nb_spring","Nddy_1759","neginsaeid","nekomaruNFT","neve_arts2","NFTalltalents","nftlovelycats","nftman76v3","NftSunage","nifty_bonanza","niloofarmobark","niloufarroostaa","nimaleophotos","nisamodaresi","nnvincentt","nuwanshilpa","o_sofy_arty","OdysseyHeart","ohmarabappa","OlyaEl_art","OlyaEl_art","omidhassanii","Oordinaryartist","outrageouscat1","OzsenOya","panimorfiart","pariisart_eth","peterwonderart","photocoolnft","pinkbrain_art","porky_art","Prashanth_art","Radinplay","reihan_mohebali","Reyhanekoeth","Ridnime","rodicqart","romainiti","ronycrisdianto","rooyart","Ruebyix","saba_fotouhi","SABAART90","saeideart_tez","Saeidphoto","saharnrahimi","SajiFall","salimar8686","samanehashemi","SanaIdrees__","sanam_artistic","Sapphire_moon25","Saralizadeh7","sashelka","Seckinyenici","Seendollfnft","sepideh_gerami","sexafterflowers","shabnamporjalil","shadi_baghaei","ShahnaMok","shanans_","shane_gilreath","Shaqayeq0x","ShArezou","shimsa_art","shirin93shn","SKafeelGillani","Soliiiart1","sonyaillust","SorkheAbi","speakingtomato","stela_narayana","subhrojitdeyFWD","SultanovaArt","SveBekyarova","tauma_art","teemoney_bait","The_oseven","The3rd0x","TheKairePius","TheMairePius","themanualdude","thesolorover09","VAVortex","vickwannagohome","Vierhundertneun","vikarasanni","Viorika_art","vivek_sadasivan","vrednota_kesha","vulcanstudionft","Vyvvann","womanempowerm10","yaCghD","yarkei_art","yasaminft","yasaminft","yasnasketch","yo_land_e","Yoghijuliansa_","yugoslavxx","Zacktic_ak","zaryart","zetsketches","zeusnftart888","zH3r09","zhannetpodobed","_vasicovska_","NFTalltalents","0xjpegz_eth","AGrebeshkova","alexey93kmnchk","AlienExperienc3","alirezaajafari","alwayssunny112","ambi_eth","amnach_ch","anna_xoxol","AparnaMondalNFT","ApricotBlossomD","arianr_","arijitmondal1","arimitaNFT","ArmandaBlum","artago_","Artago_","ArtHkh","Artnaz_eth","artsophiakuehn","artyxssss","arunnalimela","AtefatG","aterban158","AyazYildiz_","bahar_psh19","bank_1819","BarbaraBezina","behroozdaavari","BeriziFatemeh","bitaemm","bitua388_bitua","BohoArtRunway","boxio3","brijessh","Cassi_Moghan","chepurnyh_","cryptocitygang","dani_phstories","danielchideraa","deriniti","Diba_Adib_art","dollykabaria","DortheJOC","dreamhelenarts","durjoy_nft","EFuriosity","elena_croArt","Eshtiaghi_M","f9artist","faezehrahimi15","FaezeOstad","farazelahian","fawnarts_nft","FereshtehFarma3","ffox_vox","firelorrdArt","FotoGraaGH","Ghazalartt","Golbarg_art","graphicurve","growthrev","HanizHamdami","happyantsstudio","happyshima","hbvarun_beetle","ijlalaslam","itshokufeh","ItsNaastaaraan","Ize_Art0","JaspiroNFTs","jayjay__92","jeleyinte","johnny_olaleye","KarishmaBagla","liapsart","Lilitaart","Liliyaarts","Lily_art1","LinaZakirina","Liz_nfts","lovaniceth","magicalords","Mahsa_se_nft","MahsaAli_art","mahya_afkhami","majimagart","masisus","Mathouttt","matifo970","medinnft","Medvedica_2017","MerinMiler","metamorphix_nft","micca_art","MichaelEnechi","miiladmoghadam","MikeHalasa","Minalisa1991","Minas_Sanim","mohade3_nft","MonikaNFT","moon__theater","MoonaLuna_eth","mosio_eth","MrsUnbreakablee","mshartistry","mystery_nft1","Narciss369","nb_spring","Nddy_1759","neginsaeid","neve_arts2","NFTalltalents","nftman76v3","NftSunage","nifty_bonanza","niloofarmobark","nisamodaresi","nnvincentt","nuwanshilpa","o_sofy_arty","OdysseyHeart","ohmarabappa","OlyaEl_art","omidhassanii","Oordinaryartist","peterwonderart","pinkbrain_art","Prashanth_art","reihan_mohebali","Reyhanekoeth","Ridnime","rodicqart","romainiti","rooyart","ruebyix","SABAART90","saeideart_tez","Saeidphoto","Saharnrahimi","SajiFall","samanehashemi","SanaIdrees__","sanam_artistic","Saralizadeh7","sashelka","Seckinyenici","Seendollfnft","sepideh_gerami","shabnamporjalil","shanans_","shane_gilreath","ShArezou","shirin93shn","SKafeelGillani","Soliiiart1","SorkheAbi","stela_narayana","subhrojitdeyFWD","SveBekyarova","The_oseven","The3rd0x","TheKairePius","TheMairePius","themanualdude","VAVortex","vivek_sadasivan","vulcanstudionft","Vyvvann","Yasaminft","yo_land_e","Yoghijuliansa_","yugoslavxx","zaryart","zetsketches"].sort();
 //   let sortedUsers = [...new Set(users)].sort();
    console.log(sortedUsers, sortedUsers.length);
    let userUrl = 'https://api.twitter.com/2/users/by';
    let chunk = Math.round(sortedUsers.length/99);
    let userData = [];
    for(let c=0; c<chunk; c++) {
        let segment = sortedUsers.splice(0, 99);
        let userList = segment.join(',');
        console.log(userList);
        let params = {
            "usernames": userList,
            "user.fields": "name,username,location,pinned_tweet_id,profile_image_url,public_metrics,url"
        };
    
        const res = await needle('get', userUrl, params, {
            headers: {
                "User-Agent": "v2TweetLookupJS",
                "authorization": `Bearer ${XTOKEN}`
            }
        });

        if (res.body && res.body.data && Array.isArray(res.body.data)) {
            console.log('BEFORE', userData.length, res.body.data.length)
            userData.push(...res.body.data);
            console.log('AFTER', userData.length, res.body.data.length)
            //            console.log(JSON.stringify(res.body, null, 2));
//            return res.body;
        } else {
            console.log(res.body)
        }

    }
    fse.writeJsonSync(path.join(ROOT,'users.json'), userData);
    console.log('User count', userData.length);
    
}

async function getTwitter(tweetId, username, useCache) {
    const filePath = path.join(ROOT, 'posts', tweetId + '.json');
    if (fse.existsSync(filePath) && useCache) {
        let data = fse.readJSONSync(filePath);
        if (data.data.length > 0) {
            return (data);
        }
    }

    let params = {
        "max_results": 100,
        "query": `conversation_id:${tweetId} from:${username} to:${username}`,
        "tweet.fields": "in_reply_to_user_id,author_id,created_at,conversation_id,entities"
    };

    let threadURL = "https://api.twitter.com/2/tweets/search/recent";

    // this is the HTTP header that adds bearer token authentication
    console.log("X Request", tweetId, username)
    let rateBalance = 0;
    const res = await needle('get', threadURL, params, {
            headers: {
                "User-Agent": "v2TweetLookupJS",
                "authorization": `Bearer ${XTOKEN}`
            }
        });
    
        let rateIndex = res.rawHeaders.indexOf('x-rate-limit-remaining');
        rateBalance = Number(res.rawHeaders[rateIndex + 1]);
        console.log('X rate limit remaining', rateBalance);
        if (rateBalance == 0) {
            throw new Error("Rate balance exceeded")
        }        
    
    if (res.body && res.body.data && Array.isArray(res.body.data)) {
        fse.writeFileSync(filePath, JSON.stringify(res.body, null, 2));
        return res.body;
    } else {
        const result = { data: [] };
        fse.writeFileSync(filePath, JSON.stringify(result, null, 2));
        return result;
    }
}

async function parse(r, index, useCache) {
    let data = {};
    try {
        if (r.entities.urls && Array.isArray(r.entities.urls)) {
            data = {
                username: Array.isArray(r.entities.mentions) ? r.entities.mentions[0].username : '',
                text: r.text,
                //originalImage: Array.isArray(r.entities.urls[0].images) ?  r.entities.urls[0].images[0] : '',
                //previewImage: Array.isArray(r.entities.urls[0].images) ?  r.entities.urls[0].images[1] : '',
                nftUrl: r.entities.urls[0].unwound_url ? r.entities.urls[0].unwound_url : r.entities.urls[0].expanded_url,
                title: r.entities.urls[0].title,
                nftData: null
            }
            if (data.nftUrl.indexOf('objkt') > -1) {
                console.log(`OBJKT ${index}`, data.nftUrl)
                data.nftData = await getObjkt(data.nftUrl.replace('/listings', '').replace('/owners', ''), useCache);
            } else if (data.nftUrl.indexOf('foundation') > -1) {
                console.log(`FOUNDATION ${index}`, data.nftUrl)
                data.nftData = await getFoundation(data.nftUrl, useCache);
            } else {
                console.log(`UNKNOWN ${index}`, data.nftUrl)
                data.nftData = {
                    error: 'Marketplace not processed ' + data.nftUrl
                }
            }
        } else {
            throw new Error(index);
        }

    } catch (e) {
        console.log('ERROR ', e.message);
        data = {
            error: e.message + ' (' + data.text + ') ' + data.nftUrl
        }
    }

    return data;
}

function extractTwitterInfo(url) {
    let username = url.split('/')[3];
    let conversationId = extractConversationId(url);
    return { username, conversationId}
}

function extractConversationId(url) {
    url = url ?? '';
    const frags = url.split('/');
    let data = frags[frags.length - 1];
    return data.split('?')[0];
}

function extractUsername(url) {
    url = url ?? '';
    const frags = url.split('/');
    if (frags.length >= 4) {
        return frags[3].replace('@','');
    } else {
        return '';
    }
}

function processCsv(text) {
    let rows = text.toString().split('\r\n');
    const data = [];
    let index = 1;
    rows.forEach((row) => {
        if (row.startsWith('1') || row.startsWith('2')) {
            const cols = row.split(',');
            let username = extractUsername(cols[2]);
            let thread1 = extractConversationId(cols[2]);
            let thread2 = extractConversationId(cols[3]);
            let postIds = [];
            if (/^\d+$/.test(thread1)) {
                postIds.push(String(thread1));
            }
            if (/^\d+$/.test(thread2)) {
                postIds.push(String(thread2));
            }
            if (username != '' & postIds.length > 0) {
                data.push({
                    row: ++index,
                    username,
                    postIds,
                    url: cols[2]
                });    
            }
        }
    });
    return data;
}

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

async function processItem(entry, useCache) {

    const curation = {
        status: '🎉 CURATION COMPLETE',
        ethTotal: 0,
        tezTotal: 0,
        errors: [],
        items: [],
    };
    curation.postIds = entry.postIds; //['1751705669785317413', '1751717459281748028'];
    curation.username = entry.username; //'METAMORPHIX_NFT';
    console.log('URL', entry.url);
    console.log('Post IDs', curation.postIds);
    const validator = {};
    for (let p = 0; p < curation.postIds.length; p++) {
        let response = await getTwitter(curation.postIds[p], curation.username, useCache);//'1751511745468748119', 'OdysseyHeart');
        console.log('X data items', response.data.length);
        for (let i = 0; i < response.data.length; i++) {
            try {
                const item = response.data[i];
                const parsed = await parse(item, i, useCache);
                if (artists[parsed.username]) {
                    artists[parsed.username]++
                } else {
                    artists[parsed.username] = 1;
                }

                if (parsed.nftUrl) {
                    if (!validator[parsed.nftUrl]) {
                        validator[parsed.nftUrl] = 1;

                        if (parsed.error) {
                            curation.errors.push(parsed.nftData.error);
                        } else {
                            switch (parsed.nftData.marketplace) {
                                case 'objkt': curation.tezTotal += parsed.nftData.price; break;
                                case 'foundation': curation.ethTotal += parsed.nftData.price; break;
                            }
                        }
                        curation.items.push(parsed);
                    }
                }
                await sleep(5);
            }
            catch (e) {
                curation.errors.push(e);
                console.log('CURATION FOR', e);
            }
        }

    }

    if (curation.ethTotal < 0.9 || curation.tezTotal < 900 || curation.ethTotal > 1.05 || curation.tezTotal > 1050) {
        curation.status = '😕 CURATION INCOMPLETE';
    }
    const ipfsData = new Blob([JSON.stringify(curation, null, 2)]);
    const cid = await IPFS.storeBlob(ipfsData);
    const ipfsUrl = `https://nftstorage.link/ipfs/${cid}`;
    const outputData = { row: entry.row, status: curation.status, ethTotal: curation.ethTotal, tezTotal: curation.tezTotal, errors: curation.errors.length, result: ipfsUrl };
    output.push(outputData);
    console.table(outputData);
}

const output = [];
const artists = {};

(async () => {


    try {

        if (process.argv[2].toLowerCase() === 'force') {
            let targetUrls = process.argv[3].split(',');
            const entry = {
                postIds: [],
                username: '',
                url: targetUrls[0]
            }
            targetUrls.forEach((url) => {
                const twitterInfo = extractTwitterInfo(url);
                entry.postIds.push(twitterInfo.conversationId);
                entry.username = twitterInfo.username;
            })
            console.log(`Force update for ${entry.username}`);
            await processItem(entry, false);

        } else if (process.argv[2].toLowerCase() === 'users') {
            await getTwitterUsers();
        }
        else {
            let entryCsv = process.argv[2];
            let text = fse.readFileSync(path.join(ROOT, 'entries', entryCsv.replace('!','') + '.csv'));
            const entries = processCsv(text);
            const useCache = entryCsv.endsWith('!') ? false : true;
            console.log(`Starting run for ${entries.length} entries`);
            for (let r = entries.length-1; r > 0; r--) {

                const entry = entries[r];
                await processItem(entry, useCache);

            };

            fse.writeFileSync(path.join(ROOT, `output-${formatDate()}.json`), JSON.stringify(output, null, 2));
            let curationCsv = '';
            output.map((c) => curationCsv += `${c.ethTotal},${c.tezTotal},${c.result}\r\n`);
            fse.writeFileSync(path.join(ROOT, `output-${formatDate()}.csv`), curationCsv);

            let artistCsv = '';
            Object.keys(artists).map((a) => artistCsv += `${a},${artists[a]}\r\n`);
            fse.writeFileSync(path.join(ROOT, `artists-${formatDate()}.csv`), artistCsv);
        }


    } catch (e) {
        console.log('MAIN', e);
        process.exit(-1);
    }
    process.exit();
})();

