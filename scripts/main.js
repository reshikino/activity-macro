function renderItemSheetHook(app, [elem]) {
  const nav = elem.querySelector('.sheet-navigation.tabs');
  const sheetBody = elem.querySelector('.sheet-body');
  if (!nav || !sheetBody) return;

  if (nav.querySelector('a[data-tab="AMtab"]')) return;

  const amTab = document.createElement('a');
  amTab.classList.add('item');
  amTab.setAttribute('data-tab', 'AMtab');
  amTab.innerHTML = `<span>${game.i18n.localize("activity-macro.tabs.AMtab")}</span>`;

  nav.appendChild(amTab);

  const item = app.object;
  const activities = item.system.activities?.contents || [];
  const macros = game.macros.contents.map(macro => ({
    id: macro.id,
    name: macro.name
  }));

  const activitiesWithMacros = activities.map(activity => ({
    ...activity,
    activityId: activity.id,
    macros: macros
  }));

  renderTemplate('modules/activity-macro/templates/amtab-template.hbs', {
    activities: activitiesWithMacros,
    macros: macros
  }).then(html => {
    const amTabContent = document.createElement('div');
    amTabContent.classList.add('tab', 'AMtab');
    amTabContent.setAttribute('data-group', 'primary');
    amTabContent.setAttribute('data-tab', 'AMtab');
    amTabContent.innerHTML = html;

    sheetBody.appendChild(amTabContent);

    amTab.onclick = (event) => {
      event.preventDefault();

      const tabs = nav.querySelectorAll('.item');
      tabs.forEach(tab => tab.classList.remove('active'));

      amTab.classList.add('active');

      const tabContents = sheetBody.querySelectorAll('.tab');
      tabContents.forEach(content => content.classList.remove('active'));

      amTabContent.classList.add('active');
    };

    amTabContent.querySelectorAll('.save-button').forEach(button => {
      button.addEventListener('click', async (e) => {
        const activityId = e.target.getAttribute('data-activity-id');
        const activity = activities.find(a => a.id === activityId);

        if (!activity) return;

        const input = amTabContent.querySelector(`#macro-search-${activityId}`);

        if (!input) {
          ui.notifications.error(game.i18n.localize("activity-macro.macroInputError"));
          return;
        }

        const macroSearchValue = input.value.trim();

        const macro = macros.find(m => m.name === macroSearchValue);
        const macroId = macro ? macro.id : null;
        const macroName = macro ? macro.name : null;

        try {
          await item.update({
            [`flags.activity-macro.${activityId}`]: {
              macroId: macroId,   
              macroName: macroName, 
              amactivityId: activityId
            }
          });

          ui.notifications.info(game.i18n.localize("activity-macro.dataSaved").replace("{activityName}", activity.name));
        } catch (err) {
          ui.notifications.error(game.i18n.localize("activity-macro.saveError"));
        }
      });
    });

    activities.forEach(async (activity) => {
      const savedData = await item.getFlag('activity-macro', activity.id);
      if (savedData && savedData.macroId) {
        const input = amTabContent.querySelector(`#macro-search-${activity.id}`);
        if (input) {
          input.value = savedData.macroId;
        }
      }
    });
  }).catch(err => {
    ui.notifications.error(game.i18n.localize("activity-macro.templateLoadError"));
  });
}


Hooks.on("renderItemSheet", renderItemSheetHook);

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
