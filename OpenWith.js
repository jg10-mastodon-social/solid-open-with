class OpenWith extends ReceiveResourceOS {
  update() {
    if (typeof this.resource == "undefined") {
      setTimeout(() => {
        this.update();
      }, 10);
      return false;
    }
    this.replaceChildren([]);

    let thisTypes = this.resource.types().map((x) => x.uri);
    let kb = this.os.store.graph;
    let apps = thisTypes
      .flatMap((t) =>
        kb.each(
          null,
          kb.sym("http://www.w3.org/ns/solid/terms#forClass"),
          kb.sym(t),
        ),
      )
      .filter((rego) => rego != null)
      .flatMap((rego) =>
        kb
          .each(
            rego,
            kb.sym(
              "https://jg10.solidcommunity.net/open-with/apps.ttl#uriPrefix",
            ),
            null,
          )
          .map((x) => x.value),
      )
      .filter((app) => app != null);
    apps =
      thisTypes.includes(this.typeof) && this.getAttribute("uriprefix")
        ? [this.getAttribute("uriprefix"), ...apps]
        : apps;
    console.log(apps);

    if (apps.length > 0) {
      let uri = apps[0] + encodeURIComponent(this.resource.uri);
      let link = document.createElement("a");
      link.href = uri;
      link.innerHTML = "<pos-label></pos-label>";
      this.replaceChildren(link);
      if (this.getAttribute("auto") != null) window.open(uri, "_blank");
    }
  }
}
