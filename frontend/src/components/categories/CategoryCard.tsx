import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material"
import { Category } from "./domain"

interface Props {
  category: Category
}

export default function CategoryCard(props: Props) {
  return (
    <Card sx={{ m: 1.5, maxWidth: 512 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {props.category.name}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          {(() => {
            if (props.category.keywords.length > 0) {
              return props.category.keywords.join(", ")
            } else {
              return "No keywords set"
            }
          })()}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Edit</Button>
        <Button size="small" color="error">
          Delete
        </Button>
      </CardActions>
    </Card>
  )
}
