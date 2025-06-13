async function renderItemSheetHookV2(app, element) {
  if (app.constructor.name !== "ItemSheet5e") return;

  const nav = element.querySelector("nav.sheet-tabs.tabs");
  const sheetBody = element.querySelector("section.window-content");
  if (!nav || !sheetBody) return;

  if (!document.getElementById("amtab-hide-after-style")) {
    const style = document.createElement("style");
    style.id = "amtab-hide-after-style";
    style.textContent = `
      button[data-action="addDocument"].hide-after::after {
        display: none !important;
      }
    `;
    document.head.append(style);
  }

  nav.querySelectorAll('a[data-tab="AMtab"]').forEach(el => el.remove());
  sheetBody
    .querySelectorAll('section.tab[data-tab="AMtab"]')
    .forEach(el => el.remove());

  const createBtn = sheetBody.querySelector('button[data-action="addDocument"]');

  const amTab = document.createElement("a");
  amTab.dataset.action = "tab";
  amTab.dataset.group = "primary";
  amTab.dataset.tab = "AMtab";
  amTab.innerHTML = `<span>${game.i18n.localize("activity-macro.tabs.AMtab")}</span>`;
  nav.appendChild(amTab);

  nav.addEventListener("click", async event => {
    const link = event.target.closest('a[data-action="tab"]');
    if (!link) return;
    if (createBtn) createBtn.classList.toggle("hide-after", link.dataset.tab === "AMtab");
    await app.document.setFlag("activity-macro", "lastTab", link.dataset.tab);
  });

  const item = app.document;
  const activities = item.system.activities?.contents || [];
  const macros = game.macros.contents.map(m => ({ id: m.id, name: m.name }));

  const savedFlags = await Promise.all(
    activities.map(a => item.getFlag("activity-macro", a.id))
  );

  const activitiesWithMacros = activities.map((a, i) => ({
    ...a,
    activityId: a.id,
    macros,
    macroSearchValue: savedFlags[i]?.macroName || ""
  }));

  const html = await foundry.applications.handlebars.renderTemplate(
    "modules/activity-macro/templates/amtab-template.hbs",
    { activities: activitiesWithMacros, macros }
  );

  const amTabContent = document.createElement("section");
  const tabKey = amTab.dataset.tab.toLowerCase();
  amTabContent.classList.add(tabKey, "tab");
  amTabContent.dataset.group = "primary";
  amTabContent.dataset.tab = amTab.dataset.tab;
  amTabContent.innerHTML = html;

  if (createBtn) sheetBody.insertBefore(amTabContent, createBtn);
  else sheetBody.appendChild(amTabContent);

  const lastTab = await item.getFlag("activity-macro", "lastTab");
  if (lastTab === "AMtab") {
    app.changeTab("AMtab", "primary", { force: true, updatePosition: false });
  }

  amTabContent.querySelectorAll(".save-button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const aid = btn.dataset.activityId;
      const input = amTabContent.querySelector(`#macro-search-${aid}`);
      if (!input) return ui.notifications.error(game.i18n.localize("activity-macro.macroInputError"));
      const name = input.value.trim();
      const found = macros.find(m => m.name === name);
      await item.setFlag("activity-macro", aid, {
        macroId: found?.id ?? null,
        macroName: found?.name ?? null,
        amactivityId: aid
      });
      ui.notifications.info(
        game.i18n.localize("activity-macro.dataSaved")
          .replace("{activityName}", activities.find(a => a.id === aid).name)
      );
    });
  });
}

Hooks.on("renderApplicationV2", renderItemSheetHookV2);




function executeMacroForActivity(activity, config, results) {
  if (activity.item && activity.item.flags && activity.item.flags["activity-macro"]) {
    const amMacroFlags = activity.item.flags["activity-macro"];

    for (const key in amMacroFlags) {
      if (amMacroFlags.hasOwnProperty(key)) {
        const flag = amMacroFlags[key];

        if (flag.amactivityId === activity.id) {
          const macroId = flag.macroId;
          if (macroId) {
            const macro = game.macros.get(macroId);
            if (macro) {
              const actor = activity.actor || activity.item.actor;
              let token = null;
              if (actor) {
                token = actor.getActiveTokens()[0];
              }

              //Nysterian request
              macro.execute({
                activity: activity,
                item: activity.item,
                results: results,
                concentration: config.concentration,
                actor: actor,
                token: token
              });
            }
          }
          return;
        }
      }
    }
  }
}

Hooks.on("dnd5e.postUseActivity", executeMacroForActivity);


//tidy sheet register
Hooks.once("tidy5e-sheet.ready", api => {
  api.registerItemTab(
    new api.models.HtmlTab({
      title: game.i18n.localize("activity-macro.tabs.AMtab"),
      tabId: "activity-macro-amtab",
      html: `<div class="activity-macro-tab"></div>`,
      enabled: () => true,
      onRender: async ({ tabContentsElement, app }) => {
        const item       = app.document;
        const activities = item.system.activities?.contents || [];
        const macros     = game.macros.contents.map(m => ({ id: m.id, name: m.name }));

        const html = await foundry.applications.handlebars.renderTemplate(
          "modules/activity-macro/templates/amtab-template.hbs",
          {
            activities: activities.map(a => ({
              ...a,
              activityId: a.id,
              macros,
              macroSearchValue: item.getFlag("activity-macro", a.id)?.macroName || ""
            })),
            macros
          }
        );
        tabContentsElement.innerHTML = html;

        tabContentsElement.querySelectorAll(".save-button").forEach(btn => {
          btn.addEventListener("click", async () => {
            const aid   = btn.dataset.activityId;
            const input = tabContentsElement.querySelector(`#macro-search-${aid}`);
            const name  = input.value.trim();

            if (!name) {
              await item.setFlag("activity-macro", aid, {
                macroId:      null,
                macroName:    null,
                amactivityId: aid
              });
              return ui.notifications.info(
                game.i18n.localize("activity-macro.dataCleared")
                  .replace("{activityName}", activities.find(a => a.id === aid).name)
              );
            }

            const found = macros.find(m => m.name === name);
            await item.setFlag("activity-macro", aid, {
              macroId:      found?.id   ?? null,
              macroName:    found?.name ?? null,
              amactivityId: aid
            });
            ui.notifications.info(
              game.i18n.localize("activity-macro.dataSaved")
                .replace("{activityName}", activities.find(a => a.id === aid).name)
            );
          });
        });
      }
    }),
    { autoHeight: false }
  );
});

