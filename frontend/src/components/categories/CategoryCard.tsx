import {
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Typography,
} from "@mui/material"
import { Category } from "./domain"

interface Props {
  category: Category
  onEditButtonClick(): void
}

export default function CategoryCard(props: Props) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h5" component="div">
            {props.category.name}
          </Typography>
          <Typography variant="body2">
            {(() => {
              if (props.category.keywords.length > 0) {
                return props.category.keywords.join(", ")
              } else {
                return "No keywords set"
              }
            })()}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={props.onEditButtonClick}>
          Edit
        </Button>
        <Button size="small" color="error">
          Delete
        </Button>
      </CardActions>
    </Card>
  )
}
