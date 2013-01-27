<div id="calculations-wrapper">
  <div id="title">{{title}}</div>
  <ul class="operations-wrapper">
    {{#each operations}}<li id="{{{id}}}" class="operation-wrapper">
      <input operation="{{{id}}}" type="text" maxlength="5" />
      <span class="operation">{{{operationText}}}</span>
      <span class="equals">=</span>
      <span class="result"></span>
    </li>{{/each}}
  </ul>
  <div id="instructions">
    Enter numbers to see the results of the various operations performed on
    them. This application makes remote procedure calls to server functions
    that perform its calculations.
  </div>
  <div id="status"></div>
</div>
