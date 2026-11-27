// Página de ideas de mejora
import { el, uid, fmtDate, toast, confirmDialog } from "./util.js";
import { dbAll, dbPut, dbDel, bumpChanges } from "./db.js";

export async function renderIdeas(box) {
  const ideas = (await dbAll("ideas")).sort((a, b) => (a.done - b.done) || (b.createdAt - a.createdAt));
  box.innerHTML = "";
  const ta = el("textarea", { rows: 3, placeholder: "Escribe una idea de mejora… (admite varias líneas)", class: "full" });
  const add = el("button", { class: "btn primary", type: "button", text: "Añadir idea" });
  add.addEventListener("click", async () => {
    const text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    await dbPut("ideas", { id: uid("idea"), text, done: false, createdAt: Date.now(), updatedAt: Date.now() });
    await bumpChanges(1);
    renderIdeas(box);
  });
  box.append(el("section", { class: "panel" }, el("h3", { text: "Ideas de mejora" }), ta, el("div", { class: "row" }, add)));
  const list = el("div", { class: "ideas" });
  if (!ideas.length) list.append(el("p", { class: "muted", text: "Todavía no hay ideas apuntadas." }));
  for (const it of ideas) {
    const body = el("div", { class: "idea-text", text: it.text });
    const chk = el("input", { type: "checkbox", checked: it.done, title: "Marcar como implementada" });
    chk.addEventListener("change", async () => { it.done = chk.checked; it.updatedAt = Date.now(); await dbPut("ideas", it); await bumpChanges(1); renderIdeas(box); });
    const edit = el("button", { class: "btn small", type: "button", text: "Editar" });
    edit.addEventListener("click", () => {
      const t = el("textarea", { rows: 4, class: "full" }); t.value = it.text;
      const save = el("button", { class: "btn small primary", type: "button", text: "Guardar" });
      const cancel = el("button", { class: "btn small", type: "button", text: "Cancelar" });
      save.addEventListener("click", async () => { if (!t.value.trim()) return; it.text = t.value.trim(); it.updatedAt = Date.now(); await dbPut("ideas", it); await bumpChanges(1); renderIdeas(box); });
      cancel.addEventListener("click", () => renderIdeas(box));
      body.replaceWith(el("div", {}, t, el("div", { class: "row" }, save, cancel)));
      t.focus();
    });
    const del = el("button", { class: "btn small danger", type: "button", text: "Borrar" });
    del.addEventListener("click", async () => {
      if (!(await confirmDialog("Borrar idea", "¿Borrar esta idea?", "Borrar", true))) return;
      await dbDel("ideas", it.id); await bumpChanges(1); renderIdeas(box); toast("Idea borrada");
    });
    list.append(el("div", { class: "idea" + (it.done ? " done" : "") },
      el("label", { class: "check" }, chk, it.done ? " Implementada" : " Pendiente"),
      body,
      el("div", { class: "row" }, el("span", { class: "muted small", text: fmtDate(it.createdAt) }), edit, del)));
  }
  box.append(list);
}
