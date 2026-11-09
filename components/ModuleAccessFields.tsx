export default function ModuleAccessFields({ modules, selected }: {
  modules: { slug: string; numeral: string; short_title: string }[];
  selected: string[];
}) {
  return <fieldset className="admin-module-fields">
    <legend>Administrator module grants</legend>
    {modules.map((module) => <label key={module.slug}>
      <input type="checkbox" name="modules" value={module.slug} defaultChecked={selected.includes(module.slug)} />
      <span>{module.numeral}. {module.short_title}</span>
    </label>)}
  </fieldset>;
}
