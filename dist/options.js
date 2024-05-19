document.addEventListener("DOMContentLoaded", () => {
  restoreOptions()
  document.getElementById("saveButton").addEventListener("click", saveOptions)
})

function saveOptions() {
  const allowedCharactersFilter = document.getElementById(
    "allowedCharactersFilter"
  ).checked
  const duplicatePostsFilter = document.getElementById(
    "duplicatePostsFilter"
  ).checked
  // const multipleRepliesFilter = document.getElementById(
  //   "multipleRepliesFilter"
  // ).checked

  const japaneseNameFilter =
    document.getElementById("japaneseNameFilter").checked

  const excludeNonJapaneseFilter = document.getElementById(
    "excludeNonJapaneseFilter"
  ).checked

  chrome.storage.sync.set(
    {
      allowedCharactersFilter,
      duplicatePostsFilter,
      // multipleRepliesFilter,
      japaneseNameFilter,
      excludeNonJapaneseFilter,
    },
    () => {
      const status = document.getElementById("status")

      if (chrome.runtime.lastError) {
        status.textContent = "Error: " + chrome.runtime.lastError.message
        status.classList.remove("success")
        status.classList.add("failure")
      } else {
        status.textContent =
          "設定を保存しました。お手数ですが、設定を適用するためにXをリロードしてください。"
        status.classList.remove("failure")
        status.classList.add("success")
      }
      setTimeout(() => {
        status.classList.remove("success", "failure")
      }, 3000)
    }
  )
}

function restoreOptions() {
  chrome.storage.sync.get(
    {
      allowedCharactersFilter: true,
      duplicatePostsFilter: true,
      // multipleRepliesFilter: true,
      japaneseNameFilter: true,
      excludeNonJapaneseFilter: false,
    },
    (options) => {
      document.getElementById("allowedCharactersFilter").checked =
        options.allowedCharactersFilter
      document.getElementById("duplicatePostsFilter").checked =
        options.duplicatePostsFilter
      // document.getElementById("multipleRepliesFilter").checked =
      //   options.multipleRepliesFilter
      document.getElementById("japaneseNameFilter").checked =
        options.japaneseNameFilter
      document.getElementById("excludeNonJapaneseFilter").checked =
        options.excludeNonJapaneseFilter
    }
  )
}

document.getElementById("Level1").addEventListener("click", () => {
  document.getElementById("allowedCharactersFilter").checked = true
  document.getElementById("duplicatePostsFilter").checked = true
  document.getElementById("japaneseNameFilter").checked = false
  document.getElementById("excludeNonJapaneseFilter").checked = false
})
document.getElementById("Level2").addEventListener("click", () => {
  document.getElementById("allowedCharactersFilter").checked = true
  document.getElementById("duplicatePostsFilter").checked = true
  document.getElementById("japaneseNameFilter").checked = true
  document.getElementById("excludeNonJapaneseFilter").checked = false
})
document.getElementById("Level3").addEventListener("click", () => {
  document.getElementById("allowedCharactersFilter").checked = true
  document.getElementById("duplicatePostsFilter").checked = true
  document.getElementById("japaneseNameFilter").checked = true
  document.getElementById("excludeNonJapaneseFilter").checked = true
})
