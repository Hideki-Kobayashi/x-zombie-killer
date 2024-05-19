document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("optionsButton")
    .addEventListener("click", openOptionsPage)
})

function openOptionsPage() {
  chrome.runtime.openOptionsPage()
}
