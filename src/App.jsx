import { Container, Grid } from '@mui/material'
import SliceUploader from './components/SliceUploader'

function App() {

  return (
    <Container maxWidth="xl">
      <Grid container>
        <Grid item lg={5} xs={12}>
          <SliceUploader />
        </Grid>
        <Grid item lg={7} xs={12} id="previewer"></Grid>
      </Grid>
    </Container>
  )
}

export default App
