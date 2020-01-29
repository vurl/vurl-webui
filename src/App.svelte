<script>
  import Copy from './Copy.svelte'
  import Spinner from 'svelte-spinner'

  let url = ''
  $: urlsanitized = decodeURI(url).slice(0, 50)
  let apiurl = 'https://vurl.ir/apiv1'
  let redirecturl = 'https://vurl.ir/'
  let shorturlcomplete = false 
  let validationerror = false
  let validationmessage = ''
  let loading = false

  let onenter = (e) => {
	if (e.keyCode == 13) {
      geturl()
	}
  }

  let geturl = () => {
	if (url && url !== '') {
      // TODO: remove this line after implement API
      validationerror = false
	  loading = true	  
	  shorturlcomplete = ''

	  fetch(apiurl, {
        method: 'POST',
		body: new URLSearchParams(`url=${encodeURI(url)}`)
	  })
	  .then((response) => {
	    return response.text()
	  })
	  .then((i) => {
		shorturlcomplete = `${redirecturl}${i}`
 	    loading = false  
	  })
	  .catch(() => {
        validationerror = true
	    validationmessage = 'Server Error'  
 	    loading = false	  
	  })
	  

	} else {
      validationerror = true
	  validationmessage = 'Enter Your URL !!'  
	}
  }
</script>

<main>
  <h1>vurl</h1>
  <input
    required
    bind:value={url}
	on:keydown={onenter}
    placeholder="Enter your long URL"
    type="text" />
  <button on:click={geturl} >GO</button>
  <p class="sanitizedurl"> { urlsanitized } </p>
  {#if shorturlcomplete}
    <h2>
      <a 
	    target="_blank"
	    href={shorturlcomplete} >{ shorturlcomplete }</a>
      <Copy bind:value={shorturlcomplete} />
    </h2>
  {/if}
  {#if validationerror}
  <p  class="error">
    { validationmessage }
  </p>
  {/if}
  {#if loading}
  <Spinner
  size="50"
  speed="750"
  color="#999"
  thickness="2"
  gap="40"
  />
  {/if}
</main>

<style>
  main {
    background: white;
  	text-align: center;
  }
  
  h1 {
  	color: #ff3e00;
  	text-transform: uppercase;
  	font-size: 4em;
  	font-weight: 100;
  } 
  
  h2 {
    font-weight: normal;
  }

  input {
    padding: 0 20px;
    height: 46px;
	line-height: 46px;
    border-radius: 100px;
    width: 30%;
    min-width: 300px;
  }

  button {
    border-radius: 100px;
    width: 64px;
    height: 46px;
  }

  .sanitizedurl {
    color: #888;
    margin-top: 0;
  }

  .error {
    color: red;
  }

  @media (min-width: 640px) {
  	main {
  		max-width: none;
  	}
  }
</style>
