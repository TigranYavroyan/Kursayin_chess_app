#pragma once
#include "Piece.hpp"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class InputSystem {
public:
    InputSystem();
    ~InputSystem();
public:
    void print() const;
    void input_move();
    void setCurrentPlayer(Color change);
    void set_to_move(int toCol, int toRow);
    void set_from_move(int fromCol, int fromRow);
    json invalid_move_json () const;
    json valid_move_json (bool game_end = false, bool is_castling = false) const;
    void set_response(const json& res);
    json get_response() const;
    int get_from_row() const;
    int get_to_row() const;
    int get_from_col() const;
    int get_to_col() const;
    Color get_currentPlayer() const;
private:
    int real_from_row;
    int real_to_row;
    int real_from_col;
    int real_to_col;
    Color currentPlayer;
    const int board_size;
    json response;

    void _change(int fromRow, int toRow, int fromCol, int toCol);
    bool _input_checks(int fromRow, int fromCol, int toRow, int toCol) const ;
    std::pair<std::string, std::string> _get_rock_pos () const;
};