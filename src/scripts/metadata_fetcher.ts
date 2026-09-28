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
  "Zero no Tsukaima": "Zero no Tsukaima",

  // Film & Movie Anime (D:\Anime\Movie)
  "5 Centimeters per Second": "5 Centimeters per Second",
  "Chainsaw Man - Reze Arc": "Chainsaw Man: Reze-hen",
  "Date A Live - Mayuri Judgement": "Date A Live Movie: Mayuri Judgement",
  "Doraemon - Stand By Me": "Stand by Me Doraemon",
  "HoneyWorks - Zutto Maekara Suki Deshita": "Zutto Mae kara Suki deshita.: Kokuhaku Jikkou Iinkai",
  "LoveLive - School Idol Movie": "Love Live! The School Idol Movie",
  "Naruto Shippuden - The Movie": "NARUTO: Shippuuden Movie",
  "Sora no Otoshimono - Tokeijikake no Angeloid": "Sora no Otoshimono: Tokeijikake no Angeloid",
  "Summer Wars": "Summer Wars",
  "Sword Art Online - Extra Edition": "Sword Art Online: Extra Edition"
};

// Standard Anime Genres
const GENRE_MAP: Record<string, string> = {
  Action: "Action",
  Adventure: "Adventure",
  Comedy: "Comedy",
  Drama: "Drama",
  Ecchi: "Ecchi",
  Fantasy: "Fantasy",
  Horror: "Horror",
  "Mahou Shoujo": "Mahou Shoujo",
  Mecha: "Mecha",
  Music: "Music",
  Mystery: "Mystery",
  Psychological: "Psychological",
  Romance: "Romance",
  SciFi: "Sci-Fi",
  "Sci-Fi": "Sci-Fi",
  "Slice of Life": "Slice of Life",
  Sports: "Sports",
  Supernatural: "Supernatural",
  Thriller: "Thriller",
  Movie: "Movie",
  Film: "Movie",
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
    const isMovieFormat =
      anilistData?.format === "MOVIE" ||
      baseTitle.toLowerCase().includes("movie") ||
      [
        "5 centimeters per second",
        "chainsaw man - reze arc",
        "date a live - mayuri judgement",
        "doraemon - stand by me",
        "honeyworks - zutto maekara suki deshita",
        "summer wars",
        "sword art online - extra edition",
      ].includes(baseTitle.toLowerCase());

    if (isMovieFormat && !genres.includes("Movie")) {
      genres.unshift("Movie");
    }

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

    // Special Movie handling for known multi-part films and movie collections
    if (baseTitle === "Naruto Shippuden - The Movie") {
      console.log(`  -> Memproses 8 Film Terpisah untuk Koleksi "${baseTitle}"...`);
      const narutoEpisodes: CachedEpisodeInfo[] = [];
      const narutoDefs = [
        { ep: 1, q: "NARUTO: Shippuuden Movie", title: "Movie 1: Naruto Hurricane Chronicles" },
        { ep: 2, q: "NARUTO: Shippuuden - Kizuna", title: "Movie 2: Bonds (Kizuna)" },
        { ep: 3, q: "NARUTO: Shippuuden - Hi no Ishi wo Tsugu Mono", title: "Movie 3: The Inheritors of the Will of Fire" },
        { ep: 4, q: "NARUTO: Shippuuden - The Lost Tower", title: "Movie 4: The Lost Tower" },
        { ep: 5, q: "NARUTO: Blood Prison", title: "Movie 5: Blood Prison" },
        { ep: 6, q: "Road to Ninja: Naruto the Movie", title: "Movie 6: Road to Ninja" },
        { ep: 7, q: "The Last: Naruto the Movie", title: "Movie 7: The Last Movie" },
        { ep: 8, q: "Boruto: Naruto the Movie", title: "Movie 8: Boruto: Naruto the Movie" },
      ];
      for (const item of narutoDefs) {
        const itemMedia = await this.queryAniList(item.q);
        const itemThumb = itemMedia?.bannerImage || itemMedia?.coverImage?.extraLarge || itemMedia?.coverImage?.large || coverUrl;
        const itemSynopsis = itemMedia?.description?.replace(/<[^>]*>?/gm, "").trim() || `Film ke-${item.ep} dalam seri petualangan Naruto Shippuuden.`;
        narutoEpisodes.push({
          episodeNumber: item.ep,
          seasonNumber: 1,
          title: item.title,
          thumbnailUrl: itemThumb,
          synopsis: itemSynopsis,
        });
      }
      seasonEpisodes[1] = narutoEpisodes;
    } else if (baseTitle === "5 Centimeters per Second") {
      seasonEpisodes[1] = [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          title: "Babak 1: Ouka Shou (Bunga Sakura)",
          thumbnailUrl: coverUrl,
          synopsis: "Kisah pertemuan dan perpisahan Takaki Toono dan Akari Shinohara di bangku sekolah dasar hingga stasiun Iwafune di tengah badai salju.",
        },
        {
          episodeNumber: 2,
          seasonNumber: 1,
          title: "Babak 2: Cosmonaut",
          thumbnailUrl: posterUrl,
          synopsis: "Takaki pindah ke Tanegashima di mana Kanae Sumida jatuh cinta padanya dalam hening di bawah roket luar angkasa yang meluncur.",
        },
        {
          episodeNumber: 3,
          seasonNumber: 1,
          title: "Babak 3: Byousoku 5 Centimeter",
          thumbnailUrl: coverUrl,
          synopsis: "Takaki kini telah dewasa dan bekerja di Tokyo, terus merenungkan jarak dan waktu yang tak pernah bisa kembali seperti kecepatan jatuhnya kelopak bunga sakura.",
        },
      ];
    } else if (baseTitle === "Sword Art Online - Extra Edition") {
      seasonEpisodes[1] = [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          title: "Bagian 1: Kenangan di Aincrad",
          thumbnailUrl: coverUrl,
          synopsis: "Kirito dan teman-temannya mengingat kembali petualangan mereka di Sword Art Online saat membantu Suguha belajar berenang.",
        },
        {
          episodeNumber: 2,
          seasonNumber: 1,
          title: "Bagian 2: Pelatihan Berenang & Penyelidikan",
          thumbnailUrl: posterUrl,
          synopsis: "Asuna, Silica, dan Lisbeth melatih Suguha di kolam renang sekolah sambil Kirito menjalani konseling dengan Kikuoka Seijirou.",
        },
        {
          episodeNumber: 3,
          seasonNumber: 1,
          title: "Bagian 3: Misi Bawah Air ALO",
          thumbnailUrl: coverUrl,
          synopsis: "Kelompok Kirito bersatu di Alfheim Online untuk menjalankan quest bawah air khusus demi melihat paus legenda.",
        },
        {
          episodeNumber: 4,
          seasonNumber: 1,
          title: "Bagian 4: Pertempuran Penguasa Laut",
          thumbnailUrl: posterUrl,
          synopsis: "Klimaks quest bawah laut ALO menghadapi Abyss Lord demi memenuhi impian Yui dan melihat paus megah di lautan langit.",
        },
      ];
    } else if (baseTitle === "School Days") {
      console.log(`  -> Memproses 14 Episode Resmi School Days (12 TV + 2 OVA)...`);
      seasonEpisodes[1] = [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          title: "Ep 1: Confession",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38601/original.jpg",
          synopsis: "Makoto pertama kali melihat Kotonoha di kereta dan mengambil fotonya secara diam-diam. Sekai, teman sekelasnya, mengetahui hal itu dan berniat membantu mendekatkan Makoto dengan Kotonoha.",
        },
        {
          episodeNumber: 2,
          seasonNumber: 1,
          title: "Ep 2: The Distance Between Them",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38602/original.jpg",
          synopsis: "Makoto dan Kotonoha mulai berkencan berkat bantuan Sekai. Namun rasa canggung di antara mereka masih terasa besar, sementara Sekai mulai menyadari perasaannya sendiri terhadap Makoto.",
        },
        {
          episodeNumber: 3,
          seasonNumber: 1,
          title: "Ep 3: Missing Each Other",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38603/original.jpg",
          synopsis: "Hubungan Makoto dan Kotonoha berkembang perlahan. Di sisi lain, Sekai merasa semakin gelisah melihat kedekatan mereka berdua.",
        },
        {
          episodeNumber: 4,
          seasonNumber: 1,
          title: "Ep 4: Innocence",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38604/original.jpg",
          synopsis: "Makoto menginginkan hubungan yang lebih intim dengan Kotonoha, namun Kotonoha merasa masih terlalu dini. Makoto mulai berpaling dan mencurahkan rasa frustrasinya kepada Sekai.",
        },
        {
          episodeNumber: 5,
          seasonNumber: 1,
          title: "Ep 5: Ring of Water",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38605/original.jpg",
          synopsis: "Liburan musim panas tiba dan mereka pergi ke kolam renang bersama. Ketegangan romantis dan keraguan emosional semakin meruncing di antara Makoto, Kotonoha, dan Sekai.",
        },
        {
          episodeNumber: 6,
          seasonNumber: 1,
          title: "Ep 6: Relationships Passing",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38606/original.jpg",
          synopsis: "Makoto dan Sekai diam-diam memulai hubungan rahasia di belakang Kotonoha. Sekai merasa bersalah namun tidak sanggup melepaskan Makoto.",
        },
        {
          episodeNumber: 7,
          seasonNumber: 1,
          title: "Ep 7: Eve",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38607/original.jpg",
          synopsis: "Kotonoha mulai merasakan perubahan sikap Makoto, namun ia tetap berusaha percaya bahwa Makoto masih mencintainya. Sementara itu, gosip mulai menyebar di sekolah.",
        },
        {
          episodeNumber: 8,
          seasonNumber: 1,
          title: "Ep 8: School Festival",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38608/original.jpg",
          synopsis: "Festival sekolah dimulai. Makoto semakin menjauh dari Kotonoha dan menghabiskan sebagian besar waktunya bersama gadis-gadis lain, menimbulkan kekecewaan mendalam.",
        },
        {
          episodeNumber: 9,
          seasonNumber: 1,
          title: "Ep 9: Last day of the School Festival",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38609/original.jpg",
          synopsis: "Pada hari terakhir festival dan tarian api unggun, konflik antara Sekai, Setsuna, dan Kotonoha semakin meledak ketika Makoto semakin ceroboh dalam tindakannya.",
        },
        {
          episodeNumber: 10,
          seasonNumber: 1,
          title: "Ep 10: Mind and Body",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38610/original.jpg",
          synopsis: "Kematangan hubungan yang rusak membuat Makoto kehilangan kendali atas dirinya. Kotonoha perlahan terpuruk dalam kehancuran mental melihat perlakuan Makoto.",
        },
        {
          episodeNumber: 11,
          seasonNumber: 1,
          title: "Ep 11: The Truth about Everyone",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38611/original.jpg",
          synopsis: "Sekai mengabarkan bahwa dirinya hamil, sementara Makoto mencoba lari dari tanggung jawab dan berbalik kembali memohon pada Kotonoha yang kondisi psikologisnya makin retak.",
        },
        {
          episodeNumber: 12,
          seasonNumber: 1,
          title: "Ep 12: School Days",
          thumbnailUrl: "https://media.kitsu.app/episodes/thumbnails/38612/original.jpg",
          synopsis: "Klimaks dramatis yang tragis dari cinta segitiga yang tak terkendali di atap apartemen dan kapal pesiar (Nice Boat), mengakhiri kisah hubungan Makoto, Sekai, dan Kotonoha selamanya.",
        },
        {
          episodeNumber: 13,
          seasonNumber: 1,
          title: "Ep 13: OVA: Magical Heart Kokoro-chan",
          thumbnailUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx2940-7K1Wc96P6u8K.jpg",
          synopsis: "Spinoff komedi magis parodi dari seri School Days yang berfokus pada Kokoro Katsura yang bertransformasi menjadi mahou shoujo 'Magical Heart Kokoro-chan' menghadapi berbagai kekacauan lucu.",
        },
        {
          episodeNumber: 14,
          seasonNumber: 1,
          title: "Ep 14: OVA: Valentine Days",
          thumbnailUrl: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/2476-LhCtGB8AbAdB.jpg",
          synopsis: "Episode OVA spesial Valentine yang menyertai rilis visual novel School Days L×H, menampilkan Makoto, Sekai, Kotonoha, dan teman-teman sekolahnya dalam suasana perayaan hari kasih sayang.",
        },
      ];
    } else if (
      seasonsInfo.length === 1 &&
      seasonsInfo[0].totalEpisodes === 1 &&
      (isMovieFormat || baseTitle.includes("Stand By Me") || baseTitle.includes("Summer Wars"))
    ) {
      seasonEpisodes[1] = [
        {
          episodeNumber: 1,
          seasonNumber: 1,
          title: officialTitle,
          thumbnailUrl: coverUrl || posterUrl,
          synopsis,
        },
      ];
    } else {
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
      const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(search)}&page[limit]=5`, {
        headers: { "Accept": "application/vnd.api+json" },
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data) || json.data.length === 0) return null;
      const cleanSearch = search.toLowerCase().replace(/[^a-z0-9]+/g, "");
      const matched = json.data.find((item: any) => {
        const cTitle = (item.attributes?.canonicalTitle || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
        const slug = (item.attributes?.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
        return cTitle === cleanSearch || slug === cleanSearch;
      });
      return matched || json.data[0] || null;
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
