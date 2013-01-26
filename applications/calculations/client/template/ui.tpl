<div id="calculations-wrapper">
  <div id="title">{{title}}</div>
  {{#each operations}}<div id="{{{id}}}" class="operation-wrapper">
    <input type="text" />
    <span class="operation">{{{operationText}}}</span>
    <span class="equals">=</span>
    <span class="result"></span>
  </div>{{/each}}
  <div id="instructions"></div>
  <div id="status"></div>
</div>
