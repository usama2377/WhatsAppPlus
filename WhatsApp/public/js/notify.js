(function () {
  /*
  // Variables
  */

  /*
  // Methods
  */
  function init() {
    // Add container to hold notify item

    window.notify = notify;
  }

  function notify(options) {
    if (!isOptionsValid(options)) return;

    var $item = createNotifyItem(
      options.message || "",
      options.color || "default"
    );

    if (options.timeout) {
      setAutocloseTimeout($item, options.timeout);
    }
    if ($(".notify-container").length) {
      $(".notify-container").remove();
    }

    var $container = createNotifyContainer();
    $container.append($item);
    $(".left").prepend($container);
    if (options.color == "success") {
      $(".notify-item").prepend(
        "   " +
          `<i class="fa fa-check-circle fa-lg" aria-hidden="true"  id="infoMessage" ></i>`
      );
    } else {
      $(".notify-item").prepend(
        "   " +
          `<i class="fa fa-window-close fa-lg" aria-hidden="true"  id="errorMessage" ></i>`
      );
    }
  }

  function createNotifyContainer() {
    var $container = document.createElement("div");
    $container.className = "notify-container";

    return $container;
  }

  function createNotifyItem(message, color) {
    var $item = document.createElement("div");
    $item.classList.add("notify-item");
    $item.classList.add("notify-item--" + color);

    $item.innerHTML = message;

    return $item;
  }

  function setCloseOnClick($el) {
    $el.addEventListener("click", function () {
      $el.remove();
    });
  }

  function setAutocloseTimeout($el, timeout) {
    setTimeout(function () {
      $el.remove();
      $(".notify-container").remove();
    }, timeout);
  }

  function isOptionsValid(options) {
    return (
      options ||
      console.error(
        'usage: \n notify({ message: "OK", color: "success", timeout: 3000 })'
      )
    );
  }

  /*
  // Init
  */

  init();
})();
