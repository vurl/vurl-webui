<script>
  import { tick } from 'svelte';

  let valueCopy = null;
  export let value = null;
  let areaDom;
  let message = false;
  let timer = null

  async function copy() {
    valueCopy = value;
    await tick();
    areaDom.focus();
    areaDom.select();
    try {
      const successful = document.execCommand('copy');
      if (!successful) {
      } else{
        message = 'Copying text was successful';
		clearTimeout(timer)
		timer = setTimeout(() => {
			message = false
		}, 2000)  
	  }
    } catch (err) {
    }

    // we can notifi by event or storage about copy status
    valueCopy = null;
  }
</script>

{#if valueCopy != null}
  <textarea bind:this={areaDom}>{ valueCopy }</textarea>
{/if}
<button on:click={copy}>
<svg 
     title="Copy to clipboard"
     class="octicon octicon-clippy"
     viewBox="0 0 14 16"
     version="1.1"
     width="14"
     height="16"
     aria-hidden="true"
>
  <path fill-rule="evenodd"
        fill="#AB61B7"
        d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z"></path>
</svg>
</button>
{#if message}
<p class="copymessage" > { message } </p>
{/if}

<style>
  button {
    border-radius: 100px;
    width: 66px;
    height: 48px;
    backgroudn: transparent;
    border: 1px solid #AB61B7 !important;		
    color: white;			
    border: none;
	margin-left: 20px;
  }

  .copymessage {
    font-size: .5em;
    color: green;
  }

  textarea {
    position: fixed;
    top: 0;
    left: 0;
    width: 2em;
    height: 2em;
    padding: 0;
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
  }

  svg {
    cursor: pointer;
  }
</style>
