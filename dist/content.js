class TwitterFilter {
  constructor() {
    this.mutedWords = new Set([
      "क",
      "ख",
      "ग",
      "घ",
      "ङ",
      "च",
      "छ",
      "ज",
      "झ",
      "ञ",
      "य",
      "श",
      "ड",
      "ढ",
      "ण",
      "र",
      "ष",
      "ड़",
      "त",
      "थ",
      "द",
      "ध",
      "न",
      "ल",
      "स",
      "फ",
      "ब",
      "भ",
      "म",
      "व",
      "अ",
      "आ",
      "इ",
      "ई",
      "उ",
      "ऊ",
      "ऋ",
      "ए",
      "ऐ",
      "ओ",
      "औ",
      "प",
      "फ",
      "ब",
      "भ",
      "म",
      "य",
      "र",
      "ल",
      "व",
      "श",
      "ष",
      "स",
      "ह",
      "उ",
      "ध",
      "प",
      "म",
      "स",
      "𑘁",
      "𑘃",
      "𑘄",
      "𑘎",
      "𑘐",
      "𑘑",
      "𑘓",
      "𑘕",
      "𑘰",
      "𑘛",
      "𑘝",
      "𑘠",
      "𑘢",
      "𑘤",
      "𑘥",
      "𑘨",
      "𑘭",
      "𑘮",
      "ق",
      "غ",
      "ف",
      "ى",
      "ء",
      "ظ",
      "ط",
      "خ",
      "ض",
      "ص",
      "ن",
      "م",
      "ح",
      "ث",
      "ش",
      "ل",
      "ذ",
      "ر",
      "ت",
      "ز",
      "ي",
      "و",
      "ك",
      "ج",
      "د",
      "ب",
      "ا",
      "٠",
      "١",
      "٢",
      "٣",
      "٤",
      "٥",
      "٦",
      "٧",
      "٨",
      "٩",
      "ぷろふから",
      "プロフから",
      "ぷろふのリンク",
      "プロフのリンク",
      "ぷろふみて",
      "プロフみて",
      "プロフリンク",
      "プロフをみて",
      "プロフを見て",
      "プロフ見て",
      "マン凸",
      "パイ凸",
      "チン凸",
    ])
    this.mutedWordsRegex = new RegExp(
      Array.from(this.mutedWords).join("|"),
      "i"
    )

    this.allowedCharactersRegex =
      /^[A-Za-z0-9\s\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A1-\u00BF\u2000-\u206F\u2E00-\u2E7F\u3001-\u303F\u2190-\u21FF\u2900-\u297F\u2B00-\u2BFF\u2460-\u24FF\u3250-\u32FF\u1F100-\u1F1FF\uD835\uDD4F]*$/

    this.japaneseRegex =
      /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/

    this.options = {
      allowedCharactersFilter: true,
      duplicatePostsFilter: true,
      // multipleRepliesFilter: true,
      japaneseNameFilter: true,
      excludeNonJapaneseFilter: false,
      displayLinks: true,
    }

    this.tweetData = {
      duplicateTexts: new Map(),
      replyCounts: new Map(),
      originalAuthorID: "",
    }

    this.hiddenTweetsCount = 0
    this.countElement = null

    this.initialize()
  }

  async initialize() {
    try {
      await this.loadOptions()
      this.initObserver()
      this.hidePosts()
      this.filterSearchResults()
      this.displayOptionsLink()
    } catch (error) {
      console.error("Initialization error:", error)
    }
  }

  async loadOptions() {
    try {
      const options = await chrome.storage.sync.get(this.options)
      Object.assign(this.options, options)
    } catch (error) {
      console.error("Error loading options:", error)
    }
  }

  initObserver() {
    const observer = new MutationObserver(() => this.hidePosts())
    observer.observe(document.body, { childList: true, subtree: true })
  }

  hidePosts() {
    this.resetTweetData()
    this.hiddenTweetsCount = 0 // カウンターをリセット
    try {
      const tweets = this.getTweetsOnTimeline()

      if (this.isConversationTimeline(tweets)) {
        this.tweetData.originalAuthorID = this.getAuthorID(tweets[0])
      }

      tweets.forEach((tweet) => {
        const { allTweetText, tweetTextElement, tweetTextContent, authorName } =
          this.getTweetContent(tweet)

        if (
          this.shouldHideTweet(
            allTweetText,
            tweetTextContent,
            tweetTextElement,
            authorName
          )
        ) {
          tweet.style.display = "none"
          this.hiddenTweetsCount++ // 非表示にした投稿をカウント
        }

        this.handleDuplicateTweets(tweet, tweetTextContent)
        // this.handleMultipleReplies(tweet)
      })

      this.updateCountElement() // カウンターの要素を更新
    } catch (error) {
      console.error("Error hiding posts:", error)
    }
  }

  getTweetsOnTimeline() {
    return Array.from(
      document.querySelectorAll('article[role="article"][data-testid="tweet"]')
    )
  }

  getAuthorID(tweet) {
    const authorIDMatch = tweet
      ?.querySelector('[data-testid="User-Name"]')
      ?.textContent.match(/@([\w]+)/)
    return authorIDMatch ? authorIDMatch[1] : ""
  }

  isConversationTimeline(tweets) {
    return (
      tweets.length > 0 &&
      document.querySelector('[aria-label="タイムライン: 会話"]') !== null
    )
  }

  getTweetContent(tweet) {
    const tweetTextElement = tweet.querySelector('[data-testid="tweetText"]')
    const authorName = this.getAuthorName(tweet)

    return {
      allTweetText: tweet.textContent || "",
      tweetTextElement: tweetTextElement,
      authorName,
      tweetTextContent: tweetTextElement?.textContent || "",
    }
  }

  shouldHideTweet(
    allTweetText,
    tweetTextContent,
    tweetTextElement,
    authorName
  ) {
    if (
      this.options.allowedCharactersFilter &&
      !this.isJapaneseOrEnglishOrSignalTweet(tweetTextContent)
    ) {
      return true
    }

    if (
      this.mutedWordsRegex.test(allTweetText) ||
      this.isEmojiOnlyText(tweetTextElement)
    ) {
      return true
    }

    if (this.options.japaneseNameFilter && !this.isJapaneseName(authorName)) {
      return true
    }

    return false
  }

  isJapaneseOrEnglishOrSignalTweet(tweetTextContent) {
    return this.allowedCharactersRegex.test(tweetTextContent)
  }

  isEmojiOnlyText(tweetTextElement) {
    const tweetImages = tweetTextElement?.querySelectorAll(
      'img[src*="https://abs-0.twimg.com/emoji/"]'
    )
    const tweetTextContent = tweetTextElement?.textContent || ""
    return (
      tweetTextContent.trim().length === 0 && (tweetImages?.length || 0) > 0
    )
  }

  isJapaneseName(authorName) {
    return this.japaneseRegex.test(authorName)
  }

  // handleDuplicateTweets(tweet, tweetTextContent) {
  //   if (this.options.duplicatePostsFilter) {
  //     const tweetAuthorID = this.getAuthorID(tweet)

  //     if (this.tweetData.duplicateTexts.has(tweetTextContent)) {
  //       const firstAuthorID =
  //         this.tweetData.duplicateTexts.get(tweetTextContent)
  //       if (tweetAuthorID !== firstAuthorID) {
  //         tweet.style.display = "none"
  //         this.hiddenTweetsCount++
  //       }
  //     } else {
  //       this.tweetData.duplicateTexts.set(tweetTextContent, tweetAuthorID)
  //     }
  //   }
  // }
  handleDuplicateTweets(tweet, tweetTextContent) {
    if (this.options.duplicatePostsFilter) {
      const tweetAuthorID = this.getAuthorID(tweet)
      const cleanedTextContent = this.removeHashtags(tweetTextContent)

      let isSimilar = false
      for (let [text, authorID] of this.tweetData.duplicateTexts.entries()) {
        if (this.computeJaccardSimilarity(text, cleanedTextContent) > 0.3) {
          isSimilar = true
          break
        }
      }
      if (isSimilar) {
        tweet.style.display = "none"
        this.hiddenTweetsCount++
      } else {
        this.tweetData.duplicateTexts.set(cleanedTextContent, tweetAuthorID)
      }
    }
  }

  isAuthorTweet(tweet) {
    return tweet.textContent.includes(`@${this.tweetData.originalAuthorID}`)
  }

  getAuthorName(tweet) {
    const userNameElement = tweet.querySelector('[data-testid="User-Name"]')

    const authorName = userNameElement.textContent.split("@")[0]

    return authorName ?? ""
  }

  resetTweetData() {
    this.tweetData.duplicateTexts.clear()
    this.tweetData.replyCounts.clear()
    this.tweetData.originalAuthorID = ""
  }

  filterSearchResults() {
    const keyword = "lang:ja geocode:32.181770,140.531650,1625km "
    function insertKeyword(url) {
      const searchParams = new URLSearchParams(url.split("?")[1])
      const query = searchParams.get("q")

      if (!query || query.includes(keyword)) {
        return
      }

      searchParams.set("q", `${keyword} ${query}`)

      const newUrl = `${url.split("?")[0]}?${searchParams.toString()}`
      window.location.href = newUrl
    }

    if (this.options.excludeNonJapaneseFilter) {
      let lastHref = location.href
      const observer = new MutationObserver(function () {
        if (location.href !== lastHref) {
          lastHref = location.href
          insertKeyword(lastHref)
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })
    }
  }

  updateCountElement() {
    if (!this.countElement) {
      this.countElement = document.createElement("div")
      this.countElement.style.position = "fixed"
      this.countElement.style.top = "10px"
      this.countElement.style.right = "10px"
      this.countElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
      this.countElement.style.color = "white"
      this.countElement.style.padding = "5px 10px"
      this.countElement.style.borderRadius = "5px"
      this.countElement.style.zIndex = "9999"
      document.body.appendChild(this.countElement)
    }
    this.countElement.textContent = `消したゾンビ数: ${this.hiddenTweetsCount}`
  }

  displayOptionsLink() {
    // オプションページへのリンクを追加
    if (!this.optionsLinkElement) {
      this.optionsLinkElement = document.createElement("a")
      this.optionsLinkElement.textContent = "オプション"
      this.optionsLinkElement.style.position = "fixed"
      this.optionsLinkElement.style.top = "45px"
      this.optionsLinkElement.style.right = "10px"
      this.optionsLinkElement.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
      this.optionsLinkElement.style.color = "white"
      this.optionsLinkElement.style.padding = "5px 10px"
      this.optionsLinkElement.style.borderRadius = "5px"
      this.optionsLinkElement.style.zIndex = "9999"
      this.optionsLinkElement.style.cursor = "pointer"

      this.optionsLinkElement.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "openOptionsPage" })
      })
      document.body.appendChild(this.optionsLinkElement)
    }
  }

  computeJaccardSimilarity(text1, text2) {
    const set1 = new Set(text1.split(/\s+/))
    const set2 = new Set(text2.split(/\s+/))
    const intersection = new Set([...set1].filter((x) => set2.has(x)))
    const union = new Set([...set1, ...set2])
    const similarity = intersection.size / union.size

    return similarity
  }

  removeHashtags(text) {
    return text.replace(/#[\w一-龠ぁ-ゔァ-ヴー々〆〤]+/g, "").trim()
  }
}

new TwitterFilter()
