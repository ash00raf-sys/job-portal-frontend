document.addEventListener("DOMContentLoaded", function () {
  var searchOpen = document.getElementById("searchOpen");
  var searchClose = document.getElementById("searchClose");
  var searchWrapper = document.querySelector(".search-wrapper");

  if (searchOpen && searchWrapper) {
    searchOpen.addEventListener("click", function () {
      searchWrapper.classList.add("open");
    });
  }

  if (searchClose && searchWrapper) {
    searchClose.addEventListener("click", function () {
      searchWrapper.classList.remove("open");
    });
  }

  var cookieBox = document.getElementById("js-cookie-box");
  var cookieButton = document.getElementById("js-cookie-button");

  if (cookieBox && cookieButton) {
    var cookieName = "cookie-box";
    var existingCookie = document.cookie.split("; ").find(function (entry) {
      return entry.indexOf(cookieName + "=") === 0;
    });

    if (!existingCookie) {
      cookieBox.classList.remove("cookie-box-hide");
      cookieButton.addEventListener("click", function () {
        var expiryDays = Number(cookieBox.dataset.expireDays || "2");
        var expires = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = cookieName + "=true; expires=" + expires + "; path=/; SameSite=Lax";
        cookieBox.classList.add("cookie-box-hide");
      });
    }
  }
});
