import fs from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), "src", "data", "metadata_cache.json");

export interface CachedEpisodeInfo {
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  thumbnailUrl: string;
  synopsis?: string;
}

export interface CachedAnimeMetadata {
  id: string;
  folderBaseTitle: string;
  officialTitle: string;
  romajiTitle: string;
  englishTitle: string;
  synopsis: string;
  year: number;
  rating: string;
  status: "tamat" | "sedang";
  genres: string[];
  posterUrl: string;
  coverUrl: string;
  seasonEpisodes: Record<number, CachedEpisodeInfo[]>; // key is seasonNumber (1, 2, ...)
}

export const TITLE_SEARCH_ALIASES: Record<string, string> = {
  "11 Eyes": "11eyes",
  "Ah My Goddess": "Aa! Megami-sama!",
  "Air Gear": "Air Gear",
  "Akikan": "Akikan!",
  "Amagami SS": "Amagami SS",
  "Angel Beats": "Angel Beats!",
  "Ano Natsu de Matteru": "Ano Natsu de Matteru",
  "AnoHana": "Ano Hi Mita Hana no Namae wo Bokutachi wa Mada Shiranai.",
  "Another": "Another",
  "Ao Haru Ride": "Ao Haru Ride",
  "Ao no Exorcist": "Ao no Exorcist",
  "Asobi": "Asobi ni Iku yo!",
  "B gata H kei": "B Gata H Kei",
  "Baka and Test no Shoukanjuu": "Baka to Test to Shoukanjuu",
  "Bakemonogatari": "Bakemonogatari",
  "Barakamon": "Barakamon",
  "Beelzebub": "Beelzebub",
  "Ben-To !": "Ben-To",
  "Binbougami": "Binbougami ga!",
  "Black Bullet": "Black Bullet",
  "Black Rock Shooter": "Black★Rock Shooter (TV)",
  "Boku Wa Tomodachi": "Boku wa Tomodachi ga Sukunai",
  "Bokura ga Ita": "Bokura ga Ita",
  "Bokura Wa Minna Kawaisou": "Bokura wa Minna Kawaisou",
  "Brothers Conflict": "Brothers Conflict",
  "BTOOM !!": "BTOOOM!",
  "Bukiyou na Senpai": "Bukiyou na Senpai.",
  "Campione!": "Campione!: Matsurowanu Kamigami to Kamigoroshi no Maou",
  "Chuunibyou Demo Koi Ga Shitai!": "Chuunibyou demo Koi ga Shitai!",
  "Clannad": "Clannad",
  "Code Breaker": "Code:Breaker",
  "Code Geass - Lelouch of the Rebellion": "Code Geass: Hangyaku no Lelouch",
  "D-Frag": "D-Frag!",
  "Dakara Boku wa, H ga Dekinai": "Dakara Boku wa, H ga Dekinai.",
  "Danganronpa": "Danganronpa: Kibou no Gakuen to Zetsubou no Koukousei The Animation",
  "Danshi Koukousei No Nichijou": "Danshi Koukousei no Nichijou",
  "Date A Live": "Date A Live",
  "Diabolik Lovers": "Diabolik Lovers",
  "Dog Days": "Dog Days",
  "Durarara!!": "Durarara!!",
  "Elfen Lied": "Elfen Lied",
  "Eromanga-sensei": "Eromanga-sensei",
  "Fate Stay Night": "Fate/stay night: Unlimited Blade Works",
  "Fate Zero": "Fate/Zero",
  "Freezing": "Freezing",
  "Gabriel DropOut": "Gabriel DropOut",
  "Gakusen Toshi Asterisk": "Gakusen Toshi Asterisk",
  "Genei Wo Kakeru Taiyou": "Genei wo Kakeru Taiyou",
  "Golden Time": "Golden Time",
  "Gosick": "Gosick",
  "Guilty Crown": "Guilty Crown",
  "H2O Footprints in the Sand": "H2O: Footprints in the Sand",
  "Hagure yusha": "Hagure Yuusha no Aesthetica",
  "Haiyoru! Nyaruko-san": "Haiyore! Nyaruko-san",
  "He is my master": "Kore ga Watashi no Goshujin-sama",
  "Hentai Ouji To Warawanai Neko": "Hentai Ouji to Warawanai Neko.",
  "Highschool DxD": "High School DxD",
  "Highschool of The Dead": "Highschool of the Dead",
  "Himouto! Umaru-chan": "Himouto! Umaru-chan",
  "Hyouka": "Hyouka",
  "Infinite Stratos": "IS: Infinite Stratos",
  "Inou Battle wa Nichijou wa Naka de": "Inou-Battle wa Nichijou-kei no Naka de",
  "Inu x Boku SS": "Inu x Boku SS",
  "Inukami": "Inukami!",
  "Isshuukan Friends": "Isshuukan Friends.",
  "Itazura na Kiss": "Itazura na Kiss",
  "K": "K",
  "Kamisama Hajimemashita !": "Kamisama Hajimemashita",
  "Kamisama no Inai Nichiyoubi": "Kamisama no Inai Nichiyoubi",
  "Kanojo flag wa orarerata": "Kanojo ga Flag wo Oraretara",
  "Kanokon": "Kanokon",
  "Karakai Jouzu no Takagi-san": "Karakai Jouzu no Takagi-san",
  "Kateikyo hitman reborn": "Katekyo Hitman Reborn!",
  "Ketsuekigata-kun": "Ketsuekigata-kun!",
  "Kimi ga Aruji de Shitsuji ga": "Kimi ga Aruji de Shitsuji ga Ore de",
  "Kimi ga Nozomu Eien": "Kimi ga Nozomu Eien",
  "Kiss x sis OVA": "Kiss x Sis (OVA)",
  "Koi to Senkyo to Chocolate": "Koi to Senkyo to Chocolate",
  "Kokoro Connect": "Kokoro Connect",
  "Kono naka hitori , Imouto ga Iru": "Kono Naka ni Hitori, Imouto ga Iru!",
  "Kono Subarashii Sekai ni Shukufuku wo !": "Kono Subarashii Sekai ni Shukufuku wo!",
  "Kore wa Zombie desu ka": "Kore wa Zombie Desu ka?",
  "Kuzu no Honkai": "Kuzu no Honkai",
  "Kyoukai no Kanata": "Kyoukai no Kanata",
  "Little Busters!": "Little Busters!",
  "Log Horizon": "Log Horizon",
  "LoveLive!": "Love Live! School Idol Project",
  "Machine-Doll wa Kizutsukanai": "Machine-Doll wa Kizutsukanai",
  "Magi": "Magi: The Labyrinth of Magic",
  "Maken ki two": "Maken-Ki! Two",
  "Mangaka-san to Assistant-san to": "Mangaka-san to Assistant-san to The Animation",
  "Masamune-kun no Revenge": "Masamune-kun no Revenge",
  "Mekaku City Actors": "Mekakucity Actors",
  "Mirai Nikki": "Mirai Nikki",
  "Mitsudomoe": "Mitsudomoe",
  "Mondaiji-tachi ga Isekai kara Kuru Sou Desu yo": "Mondaiji-tachi ga Isekai kara Kuru Sou Desu yo?",
  "Monogatari Series Second Season": "Monogatari Series: Second Season",
  "My Wife is a Highschool Girl": "Okusama wa Joshikousei",
  "Nekomonogatari Kuro": "Nekomonogatari: Kuro",
  "Ninomiya": "Goshuushou-sama Ninomiya-kun",
  "Nisekoi": "Nisekoi",
  "Nisemonogatari": "Nisemonogatari",
  "No Game No Life": "No Game No Life",
  "Non Non Biyori Repeat": "Non Non Biyori Repeat",
  "Noragami": "Noragami",
  "NouCome": "Ore no Nounai Sentakushi ga, Gakuen Love Comedy wo Zenryoku de Jama Shiteiru",
  "Nura": "Nurarihyon no Mago",
  "Omamori Himari": "Omamori Himari",
  "One Punch Man": "One Punch Man",
  "Onee chan ga kita": "Onee-chan ga Kita",
  "Ookami Shoujo to Kuro Ouji": "Ookami Shoujo to Kuro Ouji",
  "Oregairu": "Yahari Ore no Seishun Love Comedy wa Machigatteiru.",
  "Oreimo": "Ore no Imouto ga Konna ni Kawaii Wake ga Nai",
  "OreShura": "Ore no Kanojo to Osananajimi ga Shuraba Sugiru",
  "Plastic Memories": "Plastic Memories",
  "Princess Lover": "Princess Lover!",
  "Rail Wars": "Rail Wars!",
  "Rakudai Kishi no Cavalry": "Rakudai Kishi no Cavalry",
  "Rec !": "Rec",
  "Renai Boukun": "Renai Boukun",
  "Rental Magica": "Rental Magica",
  "Rosario Vampire": "Rosario to Vampire",
  "Rozen Maiden": "Rozen Maiden",
  "Sakurasou no Pet na Kanojo": "Sakurasou no Pet na Kanojo",
  "Sankarea": "Sankarea",
  "School Days": "School Days",
  "School Rumble": "School Rumble",
  "Seikoku no Dragonar": "Seikoku no Dragonar",
  "Seikon no Qwaser": "Seikon no Qwaser",
  "Seiren": "Seiren",
  "Seitokai Yakuindomo": "Seitokai Yakuindomo",
  "Sekirei": "Sekirei",
  "Shakugan no Shana": "Shakugan no Shana",
  "Shingeki no Kyojin": "Shingeki no Kyojin",
  "Shingetsutan Tsukihime": "Shingetsutan Tsukihime",
  "Sora no Otoshimono": "Sora no Otoshimono",
  "Special A": "Special A",
  "Strike the Blood": "Strike the Blood",
  "Sukitte Iinayo": "Sukitte Ii na yo.",
  "Sword Art Online": "Sword Art Online",
  "Taimadou Gakuen 35 Shiken Shoutai": "Taimadou Gakuen 35 Shiken Shoutai",
  "The Law of Ueki": "Ueki no Housoku",
  "The World God Only Knows": "Kami nomi zo Shiru Sekai",
  "To Aru Kagaku no Railgun": "Toaru Kagaku no Railgun",
  "To Aru Majutsu no Index": "Toaru Majutsu no Index",
  "To LOVE-Ru": "To LOVE-Ru",
  "Tokyo Ghoul": "Tokyo Ghoul",
  "Tokyo Ravens": "Tokyo Ravens",
  "Tonari no Kaibutsu-kun": "Tonari no Kaibutsu-kun",
  "ToraDora !": "Toradora!",
  "Trinity Seven": "Trinity Seven",
  "True Tears": "True Tears",
  "Tsuki ga Kirei": "Tsuki ga Kirei",
  "White Album": "White Album",
  "Yosuga no sora": "Yosuga no Sora",
  "Yushibu": "Yuusha ni Narenakatta Ore wa Shibushibu Shuushoku wo Ketsui Shimashita.",
  "Zero no Tsukaima": "Zero no Tsukaima"
};

// Genre mapping to Indonesian
const GENRE_MAP: Record<string, string> = {
  Action: "Aksi",
  Adventure: "Petualangan",
  Comedy: "Komedi",
  Drama: "Drama",
  Ecchi: "Ecchi",
  Fantasy: "Fantasi",
  Horror: "Horor",
  "Mahou Shoujo": "Mahou Shoujo",
  Mecha: "Mecha",
  Music: "Musik",
  Mystery: "Misteri",
  Psychological: "Psikologis",
  Romance: "Romansa",
  SciFi: "Sci-Fi",
  "Sci-Fi": "Sci-Fi",
  "Slice of Life": "Slice of Life",
  Sports: "Olahraga",
  Supernatural: "Supernatural",
  Thriller: "Thriller",
};

const MULTI_SEASON_SEARCH_MAP: Record<string, Record<number, string>> = {
  "LoveLive!": {
    1: "Love Live! School Idol Project",
    2: "Love Live! School Idol Project 2nd Season",
  },
  "Sword Art Online": {
    1: "Sword Art Online",
    2: "Sword Art Online II",
  },
  "Date A Live": {
    1: "Date A Live",
    2: "Date A Live II",
  },
  "Clannad": {
    1: "Clannad",
    2: "Clannad After Story",
  },
  "Code Geass - Lelouch of the Rebellion": {
    1: "Code Geass: Hangyaku no Lelouch",
    2: "Code Geass: Hangyaku no Lelouch R2",
  },
  "Noragami": {
    1: "Noragami",
    2: "Noragami Aragoto",
  },
  "Magi": {
    1: "Magi: The Labyrinth of Magic",
    2: "Magi: The Kingdom of Magic",
  },
  "Chuunibyou Demo Koi Ga Shitai!": {
    1: "Chuunibyou demo Koi ga Shitai!",
    2: "Chuunibyou demo Koi ga Shitai! Ren",
  },
  "To Aru Kagaku no Railgun": {
    1: "Toaru Kagaku no Railgun",
    2: "Toaru Kagaku no Railgun S",
  },
  "Sora no Otoshimono": {
    1: "Sora no Otoshimono",
    2: "Sora no Otoshimono Forte",
  },
  "Zero no Tsukaima": {
    1: "Zero no Tsukaima",
    2: "Zero no Tsukaima: Futatsuki no Kishi",
  },
  "Sekirei": {
    1: "Sekirei",
    2: "Sekirei: Pure Engagement",
  },
  "Rosario Vampire": {
    1: "Rosario to Vampire",
    2: "Rosario to Vampire Capu2",
  },
  "Boku Wa Tomodachi": {
    1: "Boku wa Tomodachi ga Sukunai",
    2: "Boku wa Tomodachi ga Sukunai NEXT",
  },
  "Amagami SS": {
    1: "Amagami SS",
    2: "Amagami SS+ plus",
  },
  "Karakai Jouzu no Takagi-san": {
    1: "Karakai Jouzu no Takagi-san",
    2: "Karakai Jouzu no Takagi-san 2",
  },
  "Kono Subarashii Sekai ni Shukufuku wo !": {
    1: "Kono Subarashii Sekai ni Shukufuku wo!",
    2: "Kono Subarashii Sekai ni Shukufuku wo! 2",
  },
  "Rozen Maiden": {
    1: "Rozen Maiden",
    2: "Rozen Maiden (2013)",
  },
  "Nura": {
    1: "Nurarihyon no Mago",
    2: "Nurarihyon no Mago: Sennen Makyou",
  },
  "To LOVE-Ru": {
    1: "To LOVE-Ru",
    2: "Motto To LOVE-Ru",
    3: "To LOVE-Ru Darkness",
  },
};

export class MetadataFetcher {
  private cache: Record<string, CachedAnimeMetadata> = {};

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        this.cache = JSON.parse(raw);
        console.log(`[MetadataFetcher] Loaded ${Object.keys(this.cache).length} cached metadata entries.`);
      }
    } catch (e: any) {
      console.warn("[MetadataFetcher] Failed to load cache:", e.message);
      this.cache = {};
    }
  }

  public saveCache() {
    try {
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (e: any) {
      console.warn("[MetadataFetcher] Failed to save cache:", e.message);
    }
  }

  public getCached(key: string): CachedAnimeMetadata | null {
    return this.cache[key] || null;
  }

  public async fetchAnimeMetadata(
    baseTitle: string,
    seasonsInfo: { seasonNumber: number; folderName: string; totalEpisodes: number }[]
  ): Promise<CachedAnimeMetadata> {
    if (this.cache[baseTitle] && this.cache[baseTitle].posterUrl && !this.cache[baseTitle].posterUrl.includes("unsplash.com")) {
      let allSeasonsCached = true;
      for (const s of seasonsInfo) {
        const epList = this.cache[baseTitle].seasonEpisodes?.[s.seasonNumber];
        if (!epList || epList.length === 0) {
          allSeasonsCached = false;
          break;
        }
      }
      if (allSeasonsCached) {
        return this.cache[baseTitle];
      }
    }

    const searchTerm = TITLE_SEARCH_ALIASES[baseTitle] || baseTitle;
    console.log(`[MetadataFetcher] Fetching metadata for "${baseTitle}" (Search: "${searchTerm}")...`);

    // 1. Fetch Anime info from AniList
    const anilistData = await this.queryAniList(searchTerm);

    // Fallback to Kitsu if AniList has no result
    let kitsuData: any = null;
    if (!anilistData) {
      kitsuData = await this.queryKitsu(searchTerm);
    }

    const officialTitle = anilistData?.title?.romaji || anilistData?.title?.english || kitsuData?.attributes?.canonicalTitle || baseTitle;
    const romajiTitle = anilistData?.title?.romaji || kitsuData?.attributes?.titles?.en_jp || baseTitle;
    const englishTitle = anilistData?.title?.english || kitsuData?.attributes?.titles?.en || baseTitle;

    let synopsis = anilistData?.description || kitsuData?.attributes?.synopsis || "";
    synopsis = synopsis.replace(/<[^>]*>?/gm, "").trim(); // strip html
    if (!synopsis) {
      synopsis = `Serial anime ${officialTitle} mengisahkan petualangan penuh emosi dan cerita mendalam yang memikat para penggemar anime.`;
    }

    const posterUrl = anilistData?.coverImage?.extraLarge || anilistData?.coverImage?.large || kitsuData?.attributes?.posterImage?.large || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600";
    const coverUrl = anilistData?.bannerImage || kitsuData?.attributes?.coverImage?.large || posterUrl;
    const rawGenres: string[] = anilistData?.genres || ["Anime", "Series"];
    const genres = rawGenres.map((g) => GENRE_MAP[g] || g);

    let rating = "8.2";
    if (anilistData?.averageScore) {
      rating = (anilistData.averageScore / 10).toFixed(1);
    } else if (kitsuData?.attributes?.averageRating) {
      rating = (parseFloat(kitsuData.attributes.averageRating) / 10).toFixed(1);
    }

    let year = anilistData?.seasonYear || anilistData?.startDate?.year || (kitsuData?.attributes?.startDate ? parseInt(kitsuData.attributes.startDate.slice(0, 4), 10) : 2015);
    const status: "tamat" | "sedang" = anilistData?.status === "RELEASING" ? "sedang" : "tamat";

    // 2. Fetch Season Episodes & Thumbnails
    const seasonEpisodes: Record<number, CachedEpisodeInfo[]> = {};

    for (const season of seasonsInfo) {
      const sNum = season.seasonNumber;
      console.log(`  -> Fetching episodes & thumbnails for Season ${sNum} (Folder: ${season.folderName})...`);

      // Determine search term for this specific season
      let seasonSearchTerm = MULTI_SEASON_SEARCH_MAP[baseTitle]?.[sNum];
      if (!seasonSearchTerm) {
        if (sNum === 1) {
          seasonSearchTerm = searchTerm;
        } else if (sNum === 2) {
          if (/after story/i.test(season.folderName)) seasonSearchTerm = "Clannad After Story";
          else if (/r2/i.test(season.folderName)) seasonSearchTerm = "Code Geass R2";
          else if (/aragoto/i.test(season.folderName)) seasonSearchTerm = "Noragami Aragoto";
          else if (/kingdom of magic/i.test(season.folderName)) seasonSearchTerm = "Magi The Kingdom of Magic";
          else if (/darkness/i.test(season.folderName)) seasonSearchTerm = "To LOVE-Ru Darkness";
          else if (/motto/i.test(season.folderName)) seasonSearchTerm = "Motto To LOVE-Ru";
          else if (/forte/i.test(season.folderName)) seasonSearchTerm = "Sora no Otoshimono Forte";
          else if (/\bs\b| s$/i.test(season.folderName)) seasonSearchTerm = "Toaru Kagaku no Railgun S";
          else if (/second season/i.test(season.folderName)) seasonSearchTerm = "Monogatari Series: Second Season";
          else if (/ren/i.test(season.folderName)) seasonSearchTerm = "Chuunibyou demo Koi ga Shitai! Ren";
          else seasonSearchTerm = `${searchTerm} Season ${sNum}`;
        } else {
          seasonSearchTerm = `${searchTerm} Season ${sNum}`;
        }
      }

      // Query Kitsu for episodes of this season
      const kitsuEpisodes = await this.fetchKitsuEpisodes(seasonSearchTerm, season.totalEpisodes);
      
      // Query AniList streaming episodes for this season as second option
      const aniListSeason = sNum === 1 ? anilistData : await this.queryAniList(seasonSearchTerm);
      const aniStreaming = aniListSeason?.streamingEpisodes || [];

      const episodesList: CachedEpisodeInfo[] = [];
      for (let epNum = 1; epNum <= season.totalEpisodes; epNum++) {
        // Find in kitsu
        const kEp = kitsuEpisodes.find((e) => e.number === epNum);
        // Find in anilist streaming
        const aEp = aniStreaming.find((e: any) => {
          const m = e.title?.match(/Episode\s+(\d+)/i) || e.title?.match(/^(\d+)\s*[-.]/i);
          return m && parseInt(m[1], 10) === epNum;
        });

        let epTitle = `Episode ${epNum}`;
        let epThumb = coverUrl; // high quality wide banner fallback
        let epSynopsis = `Episode ${epNum} dari ${officialTitle} (Musim ${sNum}).`;

        if (kEp && kEp.thumbnail) {
          if (kEp.title) epTitle = `Ep ${epNum}: ${kEp.title}`;
          epThumb = kEp.thumbnail;
          if (kEp.synopsis) epSynopsis = kEp.synopsis;
        } else if (aEp && aEp.thumbnail) {
          if (aEp.title) epTitle = aEp.title;
          epThumb = aEp.thumbnail;
        } else if (kEp && kEp.title) {
          epTitle = `Ep ${epNum}: ${kEp.title}`;
        }

        episodesList.push({
          episodeNumber: epNum,
          seasonNumber: sNum,
          title: epTitle,
          thumbnailUrl: epThumb,
          synopsis: epSynopsis,
        });
      }

      seasonEpisodes[sNum] = episodesList;
      await new Promise((r) => setTimeout(r, 600));
    }

    const metadata: CachedAnimeMetadata = {
      id: baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      folderBaseTitle: baseTitle,
      officialTitle,
      romajiTitle,
      englishTitle,
      synopsis,
      year,
      rating,
      status,
      genres,
      posterUrl,
      coverUrl,
      seasonEpisodes,
    };

    this.cache[baseTitle] = metadata;
    this.saveCache();
    return metadata;
  }

  private async queryAniList(search: string): Promise<any | null> {
    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
          }
          bannerImage
          description(asHtml: false)
          averageScore
          seasonYear
          startDate { year }
          genres
          status
          streamingEpisodes {
            title
            thumbnail
            url
          }
        }
      }
    `;
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { search } }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.Media || null;
    } catch {
      return null;
    }
  }

  private async queryKitsu(search: string): Promise<any | null> {
    try {
      const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(search)}&page[limit]=1`, {
        headers: { "Accept": "application/vnd.api+json" },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    } catch {
      return null;
    }
  }

  private async fetchKitsuEpisodes(search: string, maxEpisodes: number = 30): Promise<{ number: number; title: string; thumbnail?: string; synopsis?: string }[]> {
    try {
      const anime = await this.queryKitsu(search);
      if (!anime || !anime.id) return [];

      const episodes: { number: number; title: string; thumbnail?: string; synopsis?: string }[] = [];
      let offset = 0;
      const limit = 20;

      while (offset < maxEpisodes + 5) {
        const epRes = await fetch(
          `https://kitsu.io/api/edge/episodes?filter[mediaId]=${anime.id}&page[limit]=${limit}&page[offset]=${offset}&sort=number`,
          { headers: { "Accept": "application/vnd.api+json" } }
        );
        if (!epRes.ok) break;
        const epJson = await epRes.json();
        if (!epJson.data || !Array.isArray(epJson.data) || epJson.data.length === 0) break;

        for (const item of epJson.data) {
          episodes.push({
            number: item.attributes?.number,
            title: item.attributes?.canonicalTitle,
            thumbnail: item.attributes?.thumbnail?.original,
            synopsis: item.attributes?.synopsis,
          });
        }

        if (epJson.data.length < limit) break;
        offset += limit;
      }

      return episodes;
    } catch {
      return [];
    }
  }
}
