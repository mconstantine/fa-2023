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
  onDeleteButtonClick(): void
}

export default function CategoryCard(props: Props) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" spacing={1.5}>
            <Typography variant="h5" component="div">
              {props.category.name}
            </Typography>
            {props.category.isMeta ? (
              <Typography variant="overline" color="primary">
                Meta
              </Typography>
            ) : null}
          </Stack>
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
        <Button size="small" color="error" onClick={props.onDeleteButtonClick}>
          Delete
        </Button>
      </CardActions>
    </Card>
  )
}
